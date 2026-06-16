import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function translateText(text: string): Promise<string> {
  if (!text) return text;
  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`);
    const data = await res.json();
    return data[0].map((t: any[]) => t[0]).join('');
  } catch (error) {
    console.error("Translation failed for text:", text, error);
    return text;
  }
}

async function main() {
  const words = await prisma.word.findMany();
  console.log(`Translating ${words.length} words...`);

  let count = 0;
  for (const word of words) {
    // Only translate if meaning_vi contains English letters but seems not translated
    // Wait, let's just translate all meaning_vi and example that are in English
    // since meaning_vi was literally fetched from English dictionary API.

    process.stdout.write(`[${count + 1}/${words.length}] Translating "${word.word}"... `);

    const translatedMeaning = await translateText(word.meaning_vi);
    const translatedExample = word.example ? await translateText(word.example) : '';

    await prisma.word.update({
      where: { id: word.id },
      data: {
        meaning_vi: translatedMeaning,
        example: translatedExample
      }
    });

    console.log('✓');
    count++;

    // Prevent getting IP banned by Google
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('Finished translating database!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
