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

const topics = ['Education', 'Environment', 'Technology', 'Health', 'Crime', 'Government', 'Work', 'Culture', 'Globalization'];

const ieltsWords: Array<{ word: string; level: string }> = [
  // A1 - Basic
  { word: 'book', level: 'A1' },
  { word: 'school', level: 'A1' },
  { word: 'study', level: 'A1' },
  { word: 'learn', level: 'A1' },
  { word: 'teacher', level: 'A1' },
  { word: 'write', level: 'A1' },
  { word: 'read', level: 'A1' },
  { word: 'computer', level: 'A1' },
  { word: 'water', level: 'A1' },
  { word: 'food', level: 'A1' },
  { word: 'work', level: 'A1' },
  { word: 'health', level: 'A1' },
  { word: 'city', level: 'A1' },
  { word: 'country', level: 'A1' },
  { word: 'people', level: 'A1' },
  { word: 'money', level: 'A1' },

  // A2 - Elementary
  { word: 'education', level: 'A2' },
  { word: 'university', level: 'A2' },
  { word: 'knowledge', level: 'A2' },
  { word: 'technology', level: 'A2' },
  { word: 'internet', level: 'A2' },
  { word: 'information', level: 'A2' },
  { word: 'environment', level: 'A2' },
  { word: 'pollution', level: 'A2' },
  { word: 'problem', level: 'A2' },
  { word: 'solution', level: 'A2' },
  { word: 'government', level: 'A2' },
  { word: 'citizen', level: 'A2' },
  { word: 'society', level: 'A2' },
  { word: 'culture', level: 'A2' },
  { word: 'tradition', level: 'A2' },
  { word: 'community', level: 'A2' },
  { word: 'business', level: 'A2' },
  { word: 'company', level: 'A2' },
  { word: 'employee', level: 'A2' },
  { word: 'job', level: 'A2' },
  { word: 'hospital', level: 'A2' },
  { word: 'doctor', level: 'A2' },
  { word: 'medicine', level: 'A2' },
  { word: 'crime', level: 'A2' },
  { word: 'police', level: 'A2' },
  { word: 'law', level: 'A2' },

  // B1 - Intermediate
  { word: 'curriculum', level: 'B1' },
  { word: 'scholarship', level: 'B1' },
  { word: 'tutorial', level: 'B1' },
  { word: 'expertise', level: 'B1' },
  { word: 'assessment', level: 'B1' },
  { word: 'literacy', level: 'B1' },
  { word: 'innovation', level: 'B1' },
  { word: 'digital', level: 'B1' },
  { word: 'software', level: 'B1' },
  { word: 'sustainability', level: 'B1' },
  { word: 'emission', level: 'B1' },
  { word: 'renewable', level: 'B1' },
  { word: 'conservation', level: 'B1' },
  { word: 'climate', level: 'B1' },
  { word: 'nutrition', level: 'B1' },
  { word: 'symptom', level: 'B1' },
  { word: 'treatment', level: 'B1' },
  { word: 'fraud', level: 'B1' },
  { word: 'vandalism', level: 'B1' },
  { word: 'policy', level: 'B1' },
  { word: 'taxation', level: 'B1' },
  { word: 'democracy', level: 'B1' },
  { word: 'parliament', level: 'B1' },
  { word: 'colleague', level: 'B1' },
  { word: 'salary', level: 'B1' },
  { word: 'career', level: 'B1' },
  { word: 'interview', level: 'B1' },
  { word: 'unemployment', level: 'B1' },
  { word: 'heritage', level: 'B1' },
  { word: 'custom', level: 'B1' },
  { word: 'identity', level: 'B1' },
  { word: 'trade', level: 'B1' },
  { word: 'economy', level: 'B1' },
  { word: 'import', level: 'B1' },
  { word: 'export', level: 'B1' },

  // B2 - Upper Intermediate
  { word: 'pedagogy', level: 'B2' },
  { word: 'academic', level: 'B2' },
  { word: 'algorithm', level: 'B2' },
  { word: 'automation', level: 'B2' },
  { word: 'infrastructure', level: 'B2' },
  { word: 'cybersecurity', level: 'B2' },
  { word: 'biodiversity', level: 'B2' },
  { word: 'ecosystem', level: 'B2' },
  { word: 'epidemic', level: 'B2' },
  { word: 'preventive', level: 'B2' },
  { word: 'diagnose', level: 'B2' },
  { word: 'mental', level: 'B2' },
  { word: 'homicide', level: 'B2' },
  { word: 'corruption', level: 'B2' },
  { word: 'juvenile', level: 'B2' },
  { word: 'sanction', level: 'B2' },
  { word: 'cybercrime', level: 'B2' },
  { word: 'legislation', level: 'B2' },
  { word: 'bureaucracy', level: 'B2' },
  { word: 'negotiate', level: 'B2' },
  { word: 'professional', level: 'B2' },
  { word: 'multicultural', level: 'B2' },
  { word: 'ritual', level: 'B2' },
  { word: 'artistic', level: 'B2' },
  { word: 'artifact', level: 'B2' },
  { word: 'globalization', level: 'B2' },
  { word: 'outsourcing', level: 'B2' },
  { word: 'multinational', level: 'B2' },
  { word: 'barrier', level: 'B2' },
  { word: 'lifestyle', level: 'B2' },

  // C1 - Advanced
  { word: 'synthetic', level: 'C1' },
  { word: 'paradigm', level: 'C1' },
  { word: 'comprehensive', level: 'C1' },
  { word: 'infrastructure', level: 'C1' },
  { word: 'precedent', level: 'C1' },
  { word: 'jurisdiction', level: 'C1' },
  { word: 'legislation', level: 'C1' },
  { word: 'sovereignty', level: 'C1' },
  { word: 'aesthetic', level: 'C1' },
  { word: 'contraband', level: 'C1' },
  { word: 'methodology', level: 'C1' },
  { word: 'phenomenon', level: 'C1' },
  { word: 'implementation', level: 'C1' },
  { word: 'rationale', level: 'C1' },
  { word: 'sustainability', level: 'C1' },
  { word: 'accountability', level: 'C1' },

  // C2 - Proficiency
  { word: 'ephemeral', level: 'C2' },
  { word: 'ubiquitous', level: 'C2' },
  { word: 'eloquence', level: 'C2' },
  { word: 'enigma', level: 'C2' },
  { word: 'meticulous', level: 'C2' },
  { word: 'pragmatic', level: 'C2' },
  { word: 'articulate', level: 'C2' },
  { word: 'ambiguous', level: 'C2' },
];

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
    console.error(`Failed to fetch ${word}:`, error);
    return null;
  }
}

async function main() {
  console.log('Fetching word data from Free Dictionary API...\n');

  for (let i = 0; i < ieltsWords.length; i++) {
    const { word, level } = ieltsWords[i];
    const topic = topics[Math.floor(i / 8) % topics.length];

    process.stdout.write(`[${i + 1}/${ieltsWords.length}] Fetching "${word}" (${level})... `);

    const data = await fetchWordData(word);

    if (data) {
      await prisma.word.create({
        data: {
          word,
          ipa: data.ipa,
          meaning_vi: data.meaning_vi,
          example: data.example,
          synonyms: data.synonyms.join(', '),
          topic,
          level,
        },
      });
      console.log('✓');
    } else {
      await prisma.word.create({
        data: {
          word,
          topic,
          level,
          meaning_vi: '',
        },
      });
      console.log('✗ (used default)');
    }

    await new Promise(r => setTimeout(r, 150));
  }

  const count = await prisma.word.count();
  console.log(`\nSeeding finished. ${count} words inserted.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });