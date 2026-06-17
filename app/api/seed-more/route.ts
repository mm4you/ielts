import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const newTopics = [
  // Basic & Everyday (A1-B1)
  'family', 'house', 'school', 'animals', 'clothes', 'colors', 'feelings', 
  'weather', 'body', 'health', 'jobs', 'shopping', 'transport', 'city',
  'nature', 'music', 'art', 'hobbies', 'food', 'cooking', 'sports',
  
  // Advanced & Academic (B2-C2)
  'business', 'technology', 'science', 'environment', 'politics', 'society',
  'psychology', 'history', 'literature', 'gre', 'idioms', 'phrasal verbs'
];

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

function getCEFRLevel(f: number): string {
  if (f > 100) return 'A1';
  if (f > 50) return 'A2';
  if (f > 10) return 'B1';
  if (f > 3) return 'B2';
  if (f > 1) return 'C1';
  return 'C2';
}

export async function GET() {
  try {
    // 1. Pick a random topic
    const topic = newTopics[Math.floor(Math.random() * newTopics.length)];
    
    // 2. Fetch Datamuse words
    const dmRes = await fetch(`https://api.datamuse.com/words?ml=${topic}&max=100&md=f`);
    const dmWords = await dmRes.json();
    
    // 3. Filter valid words and get frequencies
    const candidates = dmWords
      .filter((d: any) => d.word.length > 3 && !d.word.includes(' '))
      .map((d: any) => {
        let f = 0;
        if (d.tags) {
          const fTag = d.tags.find((t: string) => t.startsWith('f:'));
          if (fTag) f = parseFloat(fTag.split(':')[1]);
        }
        return { word: d.word, f };
      })
      .sort(() => 0.5 - Math.random()); // Shuffle
      
    // 4. Find 5 words that don't exist in DB
    const wordsToInsert = [];
    for (const cand of candidates) {
      if (wordsToInsert.length >= 5) break;
      
      const exists = await prisma.word.findFirst({ where: { word: cand.word } });
      if (!exists) {
        // Fetch dictionary info
        try {
          const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cand.word}`);
          if (dictRes.ok) {
            const data = await dictRes.json();
            const entry = data[0];
            const meaning = entry.meanings[0];
            const definition = meaning.definitions[0];
            
            let ipa = entry.phonetic || '';
            if (!ipa && entry.phonetics && entry.phonetics.length > 0) {
              ipa = entry.phonetics.find((p: any) => p.text)?.text || '';
            }

            // Translate
            const translatedMeaning = await translateText(definition.definition);
            const finalMeaning = `${definition.definition} ||| ${translatedMeaning}`;
            
            // Map POS to Vietnamese
            const posEn = meaning.partOfSpeech;
            let finalPos = 'Không phân loại';
            if (posEn.includes('noun')) finalPos = 'Danh từ';
            else if (posEn.includes('verb')) finalPos = 'Động từ';
            else if (posEn.includes('adjective')) finalPos = 'Tính từ';
            else if (posEn.includes('adverb')) finalPos = 'Trạng từ';

            wordsToInsert.push({
              word: cand.word,
              ipa: ipa,
              meaning_vi: finalMeaning,
              example: definition.example || '',
              synonyms: meaning.synonyms ? meaning.synonyms.slice(0, 5).join(', ') : '',
              topic: topic.charAt(0).toUpperCase() + topic.slice(1),
              level: getCEFRLevel(cand.f),
              pos: finalPos
            });
          }
        } catch (e) {
          // ignore
        }
      }
    }

    if (wordsToInsert.length === 0) {
      return NextResponse.json({ inserted: 0, message: `Could not find new words in topic: ${topic}` });
    }

    // 5. Insert to DB
    await prisma.word.createMany({
      data: wordsToInsert,
      skipDuplicates: true
    });

    return NextResponse.json({ 
      inserted: wordsToInsert.length, 
      topic: topic,
      words: wordsToInsert.map(w => w.word)
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
