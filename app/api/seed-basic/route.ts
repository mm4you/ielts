import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const basicWords = [
  // Food & Drink
  { word: "apple", pos: "Danh từ", ipa: "/ˈæp.əl/", meaning_vi: "a round fruit with red or green skin ||| Quả táo", topic: "Food", level: "A1" },
  { word: "water", pos: "Danh từ", ipa: "/ˈwɔː.tər/", meaning_vi: "a clear liquid, without colour or taste ||| Nước uống", topic: "Food", level: "A1" },
  { word: "bread", pos: "Danh từ", ipa: "/bred/", meaning_vi: "a food made from flour, water, and usually yeast ||| Bánh mì", topic: "Food", level: "A1" },
  { word: "chicken", pos: "Danh từ", ipa: "/ˈtʃɪk.ɪn/", meaning_vi: "a type of bird kept on a farm for its eggs or its meat ||| Con gà, thịt gà", topic: "Food", level: "A1" },
  { word: "coffee", pos: "Danh từ", ipa: "/ˈkɒf.i/", meaning_vi: "a dark brown powder with a strong flavour and smell ||| Cà phê", topic: "Food", level: "A1" },
  
  // Daily Activities
  { word: "sleep", pos: "Động từ", ipa: "/sliːp/", meaning_vi: "to rest with your eyes closed and your mind and body not active ||| Ngủ", topic: "Daily Update", level: "A1" },
  { word: "eat", pos: "Động từ", ipa: "/iːt/", meaning_vi: "to put or take food into the mouth, chew it, and swallow it ||| Ăn", topic: "Daily Update", level: "A1" },
  { word: "walk", pos: "Động từ", ipa: "/wɔːk/", meaning_vi: "to move along by putting one foot in front of the other ||| Đi bộ", topic: "Daily Update", level: "A1" },
  { word: "run", pos: "Động từ", ipa: "/rʌn/", meaning_vi: "to move along, faster than walking ||| Chạy", topic: "Daily Update", level: "A1" },
  { word: "read", pos: "Động từ", ipa: "/riːd/", meaning_vi: "to look at words or symbols and understand what they mean ||| Đọc", topic: "Daily Update", level: "A1" },
  { word: "write", pos: "Động từ", ipa: "/raɪt/", meaning_vi: "to make marks that represent letters, words, or numbers on a surface ||| Viết", topic: "Daily Update", level: "A1" },

  // Objects & Environment
  { word: "house", pos: "Danh từ", ipa: "/haʊs/", meaning_vi: "a building that people, usually one family, live in ||| Ngôi nhà", topic: "Environment", level: "A1" },
  { word: "car", pos: "Danh từ", ipa: "/kɑːr/", meaning_vi: "a road vehicle with an engine, four wheels, and seats for a small number of people ||| Xe hơi", topic: "Technology", level: "A1" },
  { word: "book", pos: "Danh từ", ipa: "/bʊk/", meaning_vi: "a written text that can be published in printed or electronic form ||| Quyển sách", topic: "Education", level: "A1" },
  { word: "phone", pos: "Danh từ", ipa: "/fəʊn/", meaning_vi: "a device that uses either a system of wires or radio waves to communicate ||| Điện thoại", topic: "Technology", level: "A1" },
  { word: "computer", pos: "Danh từ", ipa: "/kəmˈpjuː.tər/", meaning_vi: "an electronic machine that is used for storing, organizing, and finding words, numbers, and pictures ||| Máy vi tính", topic: "Technology", level: "A1" },
  { word: "microphone", pos: "Danh từ", ipa: "/ˈmaɪ.krə.fəʊn/", meaning_vi: "a piece of equipment that you speak into to make your voice louder, or to record your voice or other sounds ||| Cái micro, mic thu âm", topic: "Technology", level: "A2" },
  { word: "camera", pos: "Danh từ", ipa: "/ˈkæm.rə/", meaning_vi: "a device for taking photographs or making films or television programmes ||| Máy ảnh, máy quay", topic: "Technology", level: "A1" },
  { word: "laptop", pos: "Danh từ", ipa: "/ˈlæp.tɒp/", meaning_vi: "a computer that is small enough to be carried around easily and is flat when closed ||| Máy tính xách tay", topic: "Technology", level: "A2" },
  { word: "bag", pos: "Danh từ", ipa: "/bæɡ/", meaning_vi: "a soft container made out of paper or thin plastic, and open at the top, used to hold foods and other goods ||| Cái túi xách, cái bao", topic: "Fashion", level: "A1" },
  { word: "shoes", pos: "Danh từ", ipa: "/ʃuːz/", meaning_vi: "one of a pair of coverings for your feet, usually made of a strong material such as leather ||| Đôi giày", topic: "Fashion", level: "A1" },
  { word: "key", pos: "Danh từ", ipa: "/kiː/", meaning_vi: "a piece of metal that has been cut into a special shape and is used for opening or closing a lock ||| Chìa khóa", topic: "Daily Update", level: "A1" },

  // Common Adjectives
  { word: "good", pos: "Tính từ", ipa: "/ɡʊd/", meaning_vi: "very satisfactory, enjoyable, pleasant, or interesting ||| Tốt, hay, giỏi", topic: "Daily Update", level: "A1" },
  { word: "bad", pos: "Tính từ", ipa: "/bæd/", meaning_vi: "unpleasant and causing difficulties or harm ||| Tồi tệ, xấu", topic: "Daily Update", level: "A1" },
  { word: "beautiful", pos: "Tính từ", ipa: "/ˈbjuː.tɪ.fəl/", meaning_vi: "very attractive ||| Xinh đẹp", topic: "Daily Update", level: "A1" },
  { word: "happy", pos: "Tính từ", ipa: "/ˈhæp.i/", meaning_vi: "feeling, showing, or causing pleasure or satisfaction ||| Vui vẻ, hạnh phúc", topic: "Daily Update", level: "A1" },
  { word: "sad", pos: "Tính từ", ipa: "/sæd/", meaning_vi: "unhappy or sorry ||| Buồn bã", topic: "Daily Update", level: "A1" },
  { word: "fast", pos: "Tính từ", ipa: "/fɑːst/", meaning_vi: "moving or happening quickly ||| Nhanh", topic: "Daily Update", level: "A1" },
  { word: "slow", pos: "Tính từ", ipa: "/sləʊ/", meaning_vi: "moving, happening, or doing something without much speed ||| Chậm chạp", topic: "Daily Update", level: "A1" },
  { word: "big", pos: "Tính từ", ipa: "/bɪɡ/", meaning_vi: "large in size or amount ||| To lớn", topic: "Daily Update", level: "A1" },
  { word: "small", pos: "Tính từ", ipa: "/smɔːl/", meaning_vi: "little in size or amount when compared with what is typical or average ||| Nhỏ bé", topic: "Daily Update", level: "A1" },

  // Work & Education (A2-B1)
  { word: "teacher", pos: "Danh từ", ipa: "/ˈtiː.tʃər/", meaning_vi: "someone whose job is to teach in a school or college ||| Giáo viên", topic: "Education", level: "A1" },
  { word: "student", pos: "Danh từ", ipa: "/ˈstjuː.dənt/", meaning_vi: "a person who is learning at a college or university ||| Học sinh, sinh viên", topic: "Education", level: "A1" },
  { word: "school", pos: "Danh từ", ipa: "/skuːl/", meaning_vi: "a place where children go to be educated ||| Trường học", topic: "Education", level: "A1" },
  { word: "job", pos: "Danh từ", ipa: "/dʒɒb/", meaning_vi: "the regular work that a person does to earn money ||| Công việc", topic: "Work", level: "A1" },
  { word: "money", pos: "Danh từ", ipa: "/ˈmʌn.i/", meaning_vi: "coins or notes that are used to buy things ||| Tiền bạc", topic: "Finance", level: "A1" },
  { word: "office", pos: "Danh từ", ipa: "/ˈɒf.ɪs/", meaning_vi: "a room or part of a building in which people work ||| Văn phòng", topic: "Work", level: "A2" },
  { word: "meeting", pos: "Danh từ", ipa: "/ˈmiː.tɪŋ/", meaning_vi: "an occasion when people come together to discuss or decide something ||| Cuộc họp", topic: "Work", level: "A2" },
  
  // Nature & Environment
  { word: "sun", pos: "Danh từ", ipa: "/sʌn/", meaning_vi: "the star that provides light and heat for the earth ||| Mặt trời", topic: "Environment", level: "A1" },
  { word: "moon", pos: "Danh từ", ipa: "/muːn/", meaning_vi: "the round object that moves in the sky around the earth ||| Mặt trăng", topic: "Environment", level: "A1" },
  { word: "star", pos: "Danh từ", ipa: "/stɑːr/", meaning_vi: "a very large ball of burning gas in space that is usually seen from the earth as a point of light in the sky at night ||| Ngôi sao", topic: "Environment", level: "A1" },
  { word: "tree", pos: "Danh từ", ipa: "/triː/", meaning_vi: "a tall plant that has a wooden trunk and branches that grow from its upper part ||| Cái cây", topic: "Environment", level: "A1" },
  { word: "flower", pos: "Danh từ", ipa: "/ˈflaʊ.ər/", meaning_vi: "the part of a plant that is often brightly coloured and has a pleasant smell ||| Bông hoa", topic: "Environment", level: "A1" },
  { word: "animal", pos: "Danh từ", ipa: "/ˈæn.ɪ.məl/", meaning_vi: "something that lives and moves but is not a human, bird, fish, or insect ||| Động vật", topic: "Environment", level: "A1" },
  { word: "dog", pos: "Danh từ", ipa: "/dɒɡ/", meaning_vi: "a common animal with four legs, especially kept by people as a pet ||| Con chó", topic: "Environment", level: "A1" },
  { word: "cat", pos: "Danh từ", ipa: "/kæt/", meaning_vi: "a small animal with fur, four legs, a tail, and claws, usually kept as a pet ||| Con mèo", topic: "Environment", level: "A1" }
];

export async function GET(request: Request) {
  try {
    const existingWords = await prisma.word.findMany({
      select: { word: true, pos: true }
    });

    let added = 0;
    const addedWords = [];

    for (const item of basicWords) {
      const exists = existingWords.some(w => w.word.toLowerCase() === item.word.toLowerCase() && w.pos === item.pos);
      if (!exists) {
        await prisma.word.create({
          data: item
        });
        added++;
        addedWords.push(item.word);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${added} basic everyday words successfully!`,
      addedWords
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
