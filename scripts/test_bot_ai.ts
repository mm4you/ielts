import { generateWordDetails } from '../lib/ai';

async function main() {
  console.log('--- TEST BOT AI GENERATION ---');
  const words = ['resilient', 'ephemeral', 'mitigate'];
  for (const word of words) {
    console.log(`\nGenerating details for word: "${word}"...`);
    const start = Date.now();
    const result = await generateWordDetails(word);
    const duration = Date.now() - start;
    console.log(`Duration: ${duration}ms`);
    if (result) {
      console.log('Result:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Failed to generate or no API key config.');
    }
  }
}

main().catch(console.error);
