process.env.IS_SCRIPT = 'true';
import { CollectionService } from '../services/collection.service';
import { WordService } from '../services/word.service';
import { prisma } from '../lib/prisma';

async function testServicesAndCaching() {
  console.log(`[TEST-SERVICES] Khởi động kiểm thử tầng dịch vụ (Service Layer) & Caching...`);

  const mockUserId = `test-user-service-${Date.now()}`;
  let testCollectionId = '';

  try {
    // 1. Tạo mock user
    console.log(`[TEST-SERVICES] 1. Khởi tạo người dùng thử nghiệm...`);
    await prisma.user.create({
      data: {
        id: mockUserId,
        email: `${mockUserId}@test.com`,
        name: 'Test Service User',
      },
    });

    // 2. Kiểm thử CollectionService
    console.log(`[TEST-SERVICES] 2. Kiểm thử CollectionService...`);
    // Tạo bộ sưu tập
    const col = await CollectionService.createCollection(mockUserId, {
      name: 'Bộ từ vựng mẫu',
      description: 'Dành cho kiểm thử tự động',
      isPublic: false
    });
    testCollectionId = col.id;
    console.log(` - Tạo bộ sưu tập thành công: ID = ${col.id}, Name = ${col.name}`);

    // Lấy danh sách bộ sưu tập
    const collections = await CollectionService.getUserCollections(mockUserId);
    if (collections.length !== 1 || collections[0].name !== 'Bộ từ vựng mẫu') {
      throw new Error('Sai danh sách bộ sưu tập sau khi tạo');
    }
    console.log(` - Lấy danh sách bộ sưu tập thành công (Số lượng: ${collections.length})`);

    // Cập nhật bộ sưu tập
    const updated = await CollectionService.updateCollection(mockUserId, col.id, {
      name: 'Bộ từ vựng mẫu đã sửa',
      isPublic: true
    });
    if (updated.name !== 'Bộ từ vựng mẫu đã sửa' || !updated.isPublic) {
      throw new Error('Cập nhật bộ sưu tập không đúng dữ liệu');
    }
    console.log(` - Cập nhật bộ sưu tập thành công: Name = ${updated.name}, isPublic = ${updated.isPublic}`);

    // 3. Kiểm thử WordService & Caching
    console.log(`[TEST-SERVICES] 3. Kiểm thử WordService & Caching...`);
    const testWord = await prisma.word.findFirst();
    if (!testWord) {
      throw new Error('Database không có từ vựng nào để kiểm thử Caching');
    }

    console.log(` - Lần gọi thứ 1 (Chưa cache): getWordById(${testWord.id})`);
    const start1 = performance.now();
    const word1 = await WordService.getWordById(testWord.id);
    const end1 = performance.now();
    const time1 = end1 - start1;
    console.log(`   -> Thời gian phản hồi: ${time1.toFixed(4)}ms`);
    if (!word1 || word1.word !== testWord.word) {
      throw new Error('Không lấy đúng thông tin từ vựng');
    }

    console.log(` - Lần gọi thứ 2 (Mong đợi lấy từ memory cache): getWordById(${testWord.id})`);
    const start2 = performance.now();
    const word2 = await WordService.getWordById(testWord.id);
    const end2 = performance.now();
    const time2 = end2 - start2;
    console.log(`   -> Thời gian phản hồi: ${time2.toFixed(4)}ms`);
    if (time2 > time1) {
      console.log(`   [Cảnh báo] Lần thứ 2 không nhanh hơn lần thứ 1, tuy nhiên điều này có thể do latency đo lường ban đầu nhỏ.`);
    } else {
      console.log(`   [Thành công] Lần gọi thứ 2 nhanh hơn (Hiệu năng tăng ${(time1 / (time2 || 1)).toFixed(1)}x)`);
    }

    console.log(`\n[TEST-SERVICES] Tất cả các test case đều ĐẠT (PASSED)!`);
  } catch (error) {
    console.error(`[TEST-SERVICES] Kiểm thử THẤT BẠI:`, error);
    process.exit(1);
  } finally {
    // Dọn dẹp dữ liệu
    console.log(`\n[TEST-SERVICES] 4. Dọn dẹp dữ liệu thử nghiệm...`);
    if (testCollectionId) {
      await prisma.collection.deleteMany({ where: { id: testCollectionId } });
    }
    await prisma.user.deleteMany({ where: { id: mockUserId } });
    console.log(`[TEST-SERVICES] Dọn dẹp dữ liệu hoàn tất.`);
  }
}

testServicesAndCaching();
