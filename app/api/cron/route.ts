import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to translate
async function translateText(text: string): Promise<string> {
  if (!text) return text;
  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`);
    const data = await res.json();
    return data[0].map((t: any[]) => t[0]).join('');
  } catch (error) {
    return text;
  }
}

// Fetch a random Datamuse word
async function fetchRandomWords(): Promise<{word: string, f: number}[]> {
  try {
    const topics = ['ielts', 'academic', 'technology', 'science', 'society', 'history', 'business'];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    const res = await fetch(`https://api.datamuse.com/words?ml=${randomTopic}&max=50&md=f`);
    const data = await res.json();
    
    // Shuffle and pick
    const shuffled = data.sort(() => 0.5 - Math.random());
    return shuffled.map((d: any) => {
      let f = 0;
      if (d.tags) {
        const fTag = d.tags.find((t: string) => t.startsWith('f:'));
        if (fTag) f = parseFloat(fTag.split(':')[1]);
      }
      return { word: d.word, f };
    });
  } catch (e) {
    return [];
  }
}

function getCEFRLevel(f: number): string {
  if (f > 100) return 'A1';
  if (f > 50) return 'A2';
  if (f > 10) return 'B1';
  if (f > 3) return 'B2';
  if (f > 1) return 'C1';
  return 'C2';
}

async function fetchDictionaryInfo(word: string) {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (!res.ok) return null;
    const data = await res.json();
    const entry = data[0];
    const meaning = entry.meanings[0];
    const definition = meaning.definitions[0];
    
    let ipa = entry.phonetic || '';
    if (!ipa && entry.phonetics && entry.phonetics.length > 0) {
      ipa = entry.phonetics.find((p: any) => p.text)?.text || '';
    }

    return {
      ipa,
      partOfSpeech: meaning.partOfSpeech,
      definition: definition.definition,
      example: definition.example || '',
      synonyms: meaning.synonyms ? meaning.synonyms.slice(0, 5).join(', ') : ''
    };
  } catch (e) {
    return null;
  }
}

export async function GET(request: Request) {
  // Check authorization header to secure the cron job (Required for Vercel Cron)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const potentialWords = await fetchRandomWords();
  let inserted = 0;
  const newWords = [];

  for (const item of potentialWords) {
    if (inserted >= 5) break; // Limit to 5 words per day to avoid Vercel timeout

    const { word, f } = item;
    if (word.length <= 3 || word.includes(' ')) continue;

    // Check if exists
    const exists = await prisma.word.findFirst({ where: { word } });
    if (exists) continue;

    const dictInfo = await fetchDictionaryInfo(word);
    if (!dictInfo) continue;

    // Translate to Vietnamese
    const translatedMeaning = await translateText(dictInfo.definition);
    const finalMeaning = `${dictInfo.definition} ||| ${translatedMeaning}`;
    const finalExample = dictInfo.example || '';

    const newWord = await prisma.word.create({
      data: {
        word,
        ipa: dictInfo.ipa,
        meaning_vi: finalMeaning,
        example: finalExample,
        synonyms: dictInfo.synonyms,
        topic: 'Daily Update',
        level: getCEFRLevel(f),
      }
    });

    newWords.push(newWord.word);
    inserted++;

    // Small delay
    await new Promise(r => setTimeout(r, 600));
  }

  return NextResponse.json({
    success: true,
    message: `Added ${inserted} new words automatically.`,
    words: newWords
  });
}
