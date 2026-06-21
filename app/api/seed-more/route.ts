import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateWordDetails } from '@/lib/ai';

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

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
        return { word: d.word, f, level: getCEFRLevel(f) };
      })
      // Lọc bỏ những từ quá hiếm gặp (f < 0.8) để tránh từ quá khó
      .filter((c: any) => c.f >= 0.8)
      .sort(() => 0.5 - Math.random()); // Shuffle

    // Group by level to ensure even distribution
    const grouped: Record<string, any[]> = { 'A1': [], 'A2': [], 'B1': [], 'B2': [], 'C1': [], 'C2': [] };
    for (const cand of candidates) {
      grouped[cand.level].push(cand);
    }

    // 4. Find 5 words that don't exist in DB (Round Robin across levels)
    const { searchParams } = new URL(req.url);
    const group = searchParams.get('group') || 'all';

    const wordsToInsert = [];
    const levels = group === 'A' ? ['A1', 'A2']
                 : group === 'B' ? ['B1', 'B2']
                 : group === 'C' ? ['C1', 'C2']
                 : ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    let levelIdx = 0;
    
    // Safety break in case all words exist in DB
    let attempts = 0;
    while (wordsToInsert.length < 5 && attempts < candidates.length) {
      const currentLevel = levels[levelIdx % levels.length];
      levelIdx++;
      attempts++;

      const candList = grouped[currentLevel];
      if (!candList || candList.length === 0) continue;

      const cand = candList.pop(); // Take one from this level

      
      const exists = await prisma.word.findFirst({ where: { word: cand.word } });
      if (!exists) {
        let added = false;
        // Thử sinh bằng AI trước để có IPA & Ví dụ chuẩn
        try {
          const aiInfo = await generateWordDetails(cand.word);
          if (aiInfo && aiInfo.meaning) {
            wordsToInsert.push({
              word: cand.word,
              ipa: aiInfo.ipa,
              meaning_vi: aiInfo.meaning,
              example: aiInfo.example,
              synonyms: aiInfo.synonyms,
              topic: topic.charAt(0).toUpperCase() + topic.slice(1),
              level: cand.level,
              pos: aiInfo.pos
            });
            added = true;
          }
        } catch (err) {
          console.error(`AI generation failed for word ${cand.word}:`, err);
        }

        // Fallback dùng dictionaryapi.dev + Google Translate
        if (!added) {
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
                level: cand.level,
                pos: finalPos
              });
            }
          } catch (e) {
            // ignore
          }
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
