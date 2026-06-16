import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

async function fetchDatamuseWords(topic: string): Promise<string[]> {
  try {
    const res = await fetch(`https://api.datamuse.com/words?ml=${topic}&max=1000`);
    const data = await res.json();
    return data.map((d: any) => d.word);
  } catch (e) {
    return [];
  }
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

async function main() {
  console.log('Fetching word lists from Datamuse...');
  const topics = ['ielts', 'academic', 'toefl', 'university', 'science', 'literature', 'business'];
  
  let allWords: string[] = [];
  for (const topic of topics) {
    const words = await fetchDatamuseWords(topic);
    allWords = [...allWords, ...words];
  }

  // Remove duplicates
  const uniqueWords = [...new Set(allWords)].filter(w => w.length > 3 && !w.includes(' '));
  console.log(`Found ${uniqueWords.length} unique words. Starting massive seed...`);

  let count = 0;
  let inserted = 0;

  for (const word of uniqueWords) {
    count++;
    
    // Check if already exists
    const exists = await prisma.word.findFirst({ where: { word } });
    if (exists) {
      continue;
    }

    process.stdout.write(`[${count}/${uniqueWords.length}] Fetching "${word}"... `);

    const dictInfo = await fetchDictionaryInfo(word);
    if (!dictInfo) {
      console.log('✗ (not found in dict API)');
      continue;
    }

    // Translate to Vietnamese
    const translatedMeaning = await translateText(dictInfo.definition);
    const translatedExample = dictInfo.example ? await translateText(dictInfo.example) : '';

    const finalMeaning = `[${dictInfo.partOfSpeech}] ${translatedMeaning}\n(EN: ${dictInfo.definition})`;
    const finalExample = dictInfo.example ? `${translatedExample}\n(EN: ${dictInfo.example})` : '';

    await prisma.word.create({
      data: {
        word,
        ipa: dictInfo.ipa,
        meaning_vi: finalMeaning,
        example: finalExample,
        synonyms: dictInfo.synonyms,
        topic: 'Academic',
        level: 'B2', // Default level for these academic words
      }
    });

    console.log('✓');
    inserted++;

    // Prevent IP ban from dictionaryAPI and Google Translate
    await new Promise(r => setTimeout(r, 600));

    // Limit to 2000 new words
    if (inserted >= 2000) {
        break;
    }
  }

  console.log(`Massive Seeding finished. ${inserted} new words inserted.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
