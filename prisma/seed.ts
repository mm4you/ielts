import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DictionaryAPIResponse {
  word: string;
  phonetic?: string;
  phonetics: Array<{ text?: string }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms: string[];
    }>;
  }>;
}

const topics = ['Education', 'Science', 'Technology', 'Health', 'Environment', 'Business', 'Arts', 'Society', 'Global'];
const levels = ['B1', 'B2', 'C1', 'C2'];

async function fetchWordData(word: string): Promise<{
  ipa: string;
  meaning_vi: string;
  example: string;
  synonyms: string[];
} | null> {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (!res.ok) return null;

    const data: DictionaryAPIResponse[] = await res.json();
    const entry = data[0];

    const ipa = entry.phonetic || entry.phonetics.find(p => p.text)?.text || '';
    const meaning = entry.meanings[0];
    const definition = meaning.definitions[0];

    const meaning_vi = `[${meaning.partOfSpeech}] ${definition.definition}`;
    const example = definition.example || '';

    const synonyms = [
      ...definition.synonyms,
      ...entry.meanings.flatMap(m => m.definitions.flatMap(d => d.synonyms))
    ].filter((s, i, arr) => arr.indexOf(s) === i).slice(0, 5);

    return { ipa, meaning_vi, example, synonyms };
  } catch (error) {
    return null;
  }
}

async function fetchWordList(): Promise<string[]> {
  try {
    // Lấy 800 từ liên quan đến học thuật/IELTS từ Datamuse
    const res = await fetch('https://api.datamuse.com/words?ml=academic+vocabulary+ielts&max=800');
    const data = await res.json();
    return data.map((item: { word: string }) => item.word).filter((w: string) => !w.includes(' ')); // Chỉ lấy từ đơn
  } catch (error) {
    console.error("Failed to fetch word list from Datamuse", error);
    return [];
  }
}

async function main() {
  console.log('Fetching massive word list from Datamuse...');
  const wordsToFetch = await fetchWordList();
  console.log(`Found ${wordsToFetch.length} words to process.`);

  let insertedCount = 0;

  for (let i = 0; i < wordsToFetch.length; i++) {
    const wordStr = wordsToFetch[i];
    
    // Skip if already in DB
    const exists = await prisma.word.findFirst({ where: { word: wordStr } });
    if (exists) {
      continue;
    }

    const topic = topics[Math.floor(Math.random() * topics.length)];
    const level = levels[Math.floor(Math.random() * levels.length)];

    process.stdout.write(`[${i + 1}/${wordsToFetch.length}] Fetching "${wordStr}"... `);

    const data = await fetchWordData(wordStr);

    if (data) {
      await prisma.word.create({
        data: {
          word: wordStr,
          ipa: data.ipa,
          meaning_vi: data.meaning_vi,
          example: data.example,
          synonyms: data.synonyms.join(', '),
          topic,
          level,
        },
      });
      insertedCount++;
      console.log('✓');
    } else {
      console.log('✗ (not found in dict API)');
    }

    // Delay to avoid hitting rate limits
    await new Promise(r => setTimeout(r, 200));
  }

  const count = await prisma.word.count();
  console.log(`\nMassive Seeding finished. ${insertedCount} new words inserted. Total words: ${count}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });