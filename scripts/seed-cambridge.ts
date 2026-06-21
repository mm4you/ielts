process.env.IS_SCRIPT = 'true';
import { prisma } from '../lib/prisma';

const cambridgeWords = [
  // C1 / C2 Academic
  { word: "ubiquitous", pos: "Tính từ", ipa: "/juːˈbɪk.wɪ.təs/", meaning_vi: "seemingly everywhere at once ||| Có mặt ở khắp mọi nơi", topic: "Technology", level: "C2" },
  { word: "paradigm", pos: "Danh từ", ipa: "/ˈpær.ə.daɪm/", meaning_vi: "a typical example or pattern of something ||| Mô hình, kiểu mẫu", topic: "Academic", level: "C1" },
  { word: "mitigate", pos: "Động từ", ipa: "/ˈmɪt.ɪ.ɡeɪt/", meaning_vi: "make less severe, serious, or painful ||| Giảm nhẹ, làm dịu bớt", topic: "Environment", level: "C1" },
  { word: "resilient", pos: "Tính từ", ipa: "/rɪˈzɪl.i.ənt/", meaning_vi: "able to withstand or recover quickly from difficult conditions ||| Kiên cường, mau phục hồi", topic: "Academic", level: "C1" },
  { word: "fluctuate", pos: "Động từ", ipa: "/ˈflʌk.tʃu.eɪt/", meaning_vi: "rise and fall irregularly in number or amount ||| Dao động, biến động", topic: "Work", level: "B2" },
  { word: "lucrative", pos: "Tính từ", ipa: "/ˈluː.krə.tɪv/", meaning_vi: "producing a great deal of profit ||| Sinh lời, béo bở", topic: "Work", level: "C1" },
  { word: "profound", pos: "Tính từ", ipa: "/prəˈfaʊnd/", meaning_vi: "very great or intense ||| Sâu sắc, uyên thâm", topic: "Academic", level: "C1" },
  { word: "ambiguous", pos: "Tính từ", ipa: "/æmˈbɪɡ.ju.əs/", meaning_vi: "open to more than one interpretation ||| Mơ hồ, nhập nhằng", topic: "Academic", level: "C1" },
  { word: "delineate", pos: "Động từ", ipa: "/dɪˈlɪn.i.eɪt/", meaning_vi: "describe or portray something precisely ||| Mô tả chi tiết, vạch ra", topic: "Academic", level: "C2" },
  { word: "conundrum", pos: "Danh từ", ipa: "/kəˈnʌn.drəm/", meaning_vi: "a confusing and difficult problem or question ||| Bài toán hóc búa", topic: "Academic", level: "C2" },
  // Everyday B1 / B2
  { word: "sustainable", pos: "Tính từ", ipa: "/səˈsteɪ.nə.bəl/", meaning_vi: "able to be maintained at a certain rate or level ||| Bền vững", topic: "Environment", level: "B2" },
  { word: "implement", pos: "Động từ", ipa: "/ˈɪm.plɪ.ment/", meaning_vi: "put a decision, plan, agreement, etc. into effect ||| Thực thi, triển khai", topic: "Government", level: "B2" },
  { word: "advocate", pos: "Danh từ", ipa: "/ˈæd.və.kət/", meaning_vi: "a person who publicly supports or recommends a particular cause or policy ||| Người ủng hộ", topic: "Government", level: "B2" },
  { word: "advocate", pos: "Động từ", ipa: "/ˈæd.və.keɪt/", meaning_vi: "publicly recommend or support ||| Biện hộ, ủng hộ", topic: "Government", level: "C1" },
  { word: "vulnerable", pos: "Tính từ", ipa: "/ˈvʌl.nər.ə.bəl/", meaning_vi: "susceptible to physical or emotional attack or harm ||| Dễ bị tổn thương", topic: "Health", level: "B2" },
  { word: "obsolete", pos: "Tính từ", ipa: "/ˌɒb.səlˈiːt/", meaning_vi: "no longer produced or used; out of date ||| Lỗi thời", topic: "Technology", level: "C1" },
  { word: "deteriorate", pos: "Động từ", ipa: "/dɪˈtɪə.ri.ə.reɪt/", meaning_vi: "become progressively worse ||| Xấu đi, tồi tệ hơn", topic: "Health", level: "C1" },
  { word: "crucial", pos: "Tính từ", ipa: "/ˈkruː.ʃəl/", meaning_vi: "decisive or critical, especially in the success or failure of something ||| Quan trọng, mang tính quyết định", topic: "Academic", level: "B2" },
  { word: "alleviate", pos: "Động từ", ipa: "/əˈliː.vi.eɪt/", meaning_vi: "make suffering, deficiency, or a problem less severe ||| Làm giảm bớt", topic: "Health", level: "C1" },
  { word: "stagnant", pos: "Tính từ", ipa: "/ˈstæɡ.nənt/", meaning_vi: "showing no activity; dull and sluggish ||| Trì trệ", topic: "Work", level: "C1" },
  { word: "consequently", pos: "Trạng từ", ipa: "/ˈkɒn.sɪ.kwənt.li/", meaning_vi: "as a result ||| Hậu quả là, do đó", topic: "Academic", level: "B2" },
  { word: "significantly", pos: "Trạng từ", ipa: "/sɪɡˈnɪf.ɪ.kənt.li/", meaning_vi: "in a sufficiently great or important way as to be worthy of attention ||| Một cách đáng kể", topic: "Academic", level: "B2" },
  { word: "moreover", pos: "Trạng từ", ipa: "/ˌmɔːrˈəʊ.vər/", meaning_vi: "as a further matter; besides ||| Hơn nữa", topic: "Academic", level: "B2" },
  { word: "furthermore", pos: "Trạng từ", ipa: "/ˌfɜː.ðəˈmɔːr/", meaning_vi: "in addition; besides ||| Ngoài ra", topic: "Academic", level: "B2" }
];

async function main() {
  console.log('Seeding Cambridge words...');
  
  // Get all existing words to avoid duplicates
  const existingWords = await prisma.word.findMany({
    select: { word: true, pos: true }
  });

  let added = 0;
  for (const item of cambridgeWords) {
    // Check if word with same POS already exists
    const exists = existingWords.some(w => w.word.toLowerCase() === item.word.toLowerCase() && w.pos === item.pos);
    if (!exists) {
      await prisma.word.create({
        data: item
      });
      console.log(`Added: ${item.word} (${item.pos})`);
      added++;
    } else {
      console.log(`Skipped duplicate: ${item.word} (${item.pos})`);
    }
  }

  console.log(`Seeding finished. Added ${added} new words.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
