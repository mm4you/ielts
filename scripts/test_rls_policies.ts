process.env.IS_SCRIPT = 'true';
import { prisma } from '../lib/prisma';

async function testRls() {
  console.log(`[TEST-RLS] Khởi động tiến trình kiểm thử chính sách Row-Level Security (RLS)...`);

  const mockUser1Id = `test-user-1-${Date.now()}`;
  const mockUser2Id = `test-user-2-${Date.now()}`;

  try {
    // 1. Tạo dữ liệu mẫu dưới danh nghĩa Script (Bypass RLS)
    console.log(`[TEST-RLS] 1. Khởi tạo người dùng mẫu (Script mode)...`);
    await prisma.user.create({
      data: {
        id: mockUser1Id,
        email: `${mockUser1Id}@test.com`,
        name: 'Test User 1',
      },
    });

    await prisma.user.create({
      data: {
        id: mockUser2Id,
        email: `${mockUser2Id}@test.com`,
        name: 'Test User 2',
      },
    });

    // Tạo từ vựng mẫu để gán tiến trình học
    const testWord = await prisma.word.findFirst();
    if (!testWord) {
      throw new Error("Không có từ vựng nào trong database để chạy test.");
    }

    console.log(`[TEST-RLS] 2. Khởi tạo dữ liệu tiến trình học mẫu cho User 1 và User 2...`);
    await prisma.userProgress.create({
      data: {
        userId: mockUser1Id,
        wordId: testWord.id,
        ease_factor: 2.5,
        interval_days: 1,
        repetition_count: 1,
      },
    });

    await prisma.userProgress.create({
      data: {
        userId: mockUser2Id,
        wordId: testWord.id,
        ease_factor: 3.0,
        interval_days: 2,
        repetition_count: 2,
      },
    });

    console.log(`[TEST-RLS] Khởi tạo dữ liệu mẫu hoàn tất.`);

    // --- TEST 1: Truy vấn dưới quyền User 1 ---
    console.log(`\n[TEST-RLS] 3. Thử nghiệm truy vấn dưới quyền User 1...`);
    // Tắt chế độ Script, kích hoạt chế độ giả lập User 1
    process.env.IS_SCRIPT = 'false';
    process.env.MOCK_USER_ID = mockUser1Id;

    const user1Progress = await prisma.userProgress.findMany();
    console.log(`[TEST-RLS] Kết quả lấy được: ${user1Progress.length} bản ghi.`);
    if (user1Progress.length !== 1 || user1Progress[0].userId !== mockUser1Id) {
      throw new Error(`Thất bại! User 1 nhìn thấy ${user1Progress.length} bản ghi thay vì 1 bản ghi của chính mình.`);
    }
    console.log(`[PASS] User 1 chỉ nhìn thấy đúng dữ liệu của mình.`);

    // Thử cập nhật dữ liệu của User 2 dưới quyền User 1
    console.log(`[TEST-RLS] Thử cập nhật dữ liệu của User 2 dưới quyền User 1...`);
    const updateResult = await prisma.userProgress.updateMany({
      where: { userId: mockUser2Id },
      data: { ease_factor: 9.9 },
    });
    console.log(`[TEST-RLS] Số bản ghi đã cập nhật: ${updateResult.count}`);
    if (updateResult.count !== 0) {
      throw new Error(`Thất bại! User 1 có thể cập nhật dữ liệu của User 2.`);
    }
    console.log(`[PASS] User 1 bị chặn không cho cập nhật dữ liệu của User 2.`);

    // --- TEST 2: Truy vấn dưới quyền User 2 ---
    console.log(`\n[TEST-RLS] 4. Thử nghiệm truy vấn dưới quyền User 2...`);
    process.env.MOCK_USER_ID = mockUser2Id;

    const user2Progress = await prisma.userProgress.findMany();
    console.log(`[TEST-RLS] Kết quả lấy được: ${user2Progress.length} bản ghi.`);
    if (user2Progress.length !== 1 || user2Progress[0].userId !== mockUser2Id) {
      throw new Error(`Thất bại! User 2 nhìn thấy ${user2Progress.length} bản ghi thay vì 1 bản ghi của chính mình.`);
    }
    console.log(`[PASS] User 2 chỉ nhìn thấy đúng dữ liệu của mình.`);

    // --- TEST 3: Truy vấn vô danh (Chưa đăng nhập) ---
    console.log(`\n[TEST-RLS] 5. Thử nghiệm truy vấn vô danh (không có session)...`);
    process.env.MOCK_USER_ID = '';

    const anonymousProgress = await prisma.userProgress.findMany();
    console.log(`[TEST-RLS] Kết quả lấy được: ${anonymousProgress.length} bản ghi.`);
    if (anonymousProgress.length !== 0) {
      throw new Error(`Thất bại! Người dùng chưa đăng nhập vẫn xem được dữ liệu tiến trình học.`);
    }
    console.log(`[PASS] Người dùng chưa đăng nhập không xem được bất kỳ dữ liệu nào.`);

    // Thử truy vấn bảng User dưới quyền vô danh (SELECT phải thành công)
    console.log(`[TEST-RLS] Thử đọc bảng User dưới quyền vô danh...`);
    const allUsers = await prisma.user.findMany({
      where: { id: { in: [mockUser1Id, mockUser2Id] } }
    });
    console.log(`[TEST-RLS] Đọc được ${allUsers.length} người dùng.`);
    if (allUsers.length !== 2) {
      throw new Error(`Thất bại! Không thể đọc bảng User dưới quyền vô danh (NextAuth sẽ bị lỗi đăng nhập).`);
    }
    console.log(`[PASS] Đọc bảng User dưới quyền vô danh hoạt động bình thường.`);

    // Thử cập nhật bảng User dưới quyền vô danh (UPDATE phải thất bại)
    console.log(`[TEST-RLS] Thử cập nhật bảng User dưới quyền vô danh...`);
    const updateAnonymousUser = await prisma.user.updateMany({
      where: { id: mockUser1Id },
      data: { name: 'Hacker' }
    });
    console.log(`[TEST-RLS] Số bản ghi đã cập nhật: ${updateAnonymousUser.count}`);
    if (updateAnonymousUser.count !== 0) {
      throw new Error(`Thất bại! Người dùng chưa đăng nhập có thể sửa đổi thông tin người dùng khác.`);
    }
    console.log(`[PASS] Chặn cập nhật User dưới quyền vô danh hoạt động tốt.`);

    // --- TEST 4: Chạy chế độ Script (Bypass RLS) ---
    console.log(`\n[TEST-RLS] 6. Thử nghiệm truy vấn trong chế độ Script (IS_SCRIPT=true)...`);
    process.env.IS_SCRIPT = 'true';
    process.env.MOCK_USER_ID = '';

    const scriptProgress = await prisma.userProgress.findMany({
      where: { userId: { in: [mockUser1Id, mockUser2Id] } }
    });
    console.log(`[TEST-RLS] Số bản ghi lấy được: ${scriptProgress.length}`);
    if (scriptProgress.length !== 2) {
      throw new Error(`Thất bại! Chế độ Script bị RLS chặn (lấy được ${scriptProgress.length} bản ghi thay vì 2).`);
    }
    console.log(`[PASS] Chế độ Script bypass RLS hoạt động hoàn hảo.`);

    console.log(`\n[SUCCESS] TOÀN BỘ CÁC BÀI KIỂM TRA RLS ĐÃ ĐẠT (ALL TESTS PASSED)!`);

  } catch (error) {
    console.error(`\n[FAIL] Kiểm tra RLS thất bại:`, error);
    process.exit(1);
  } finally {
    // Dọn dẹp dữ liệu kiểm tra
    console.log(`\n[TEST-RLS] 7. Đang dọn dẹp dữ liệu mẫu...`);
    process.env.IS_SCRIPT = 'true';
    try {
      await prisma.userProgress.deleteMany({
        where: { userId: { in: [mockUser1Id, mockUser2Id] } }
      });
      await prisma.user.deleteMany({
        where: { id: { in: [mockUser1Id, mockUser2Id] } }
      });
      console.log(`[TEST-RLS] Dọn dẹp hoàn tất.`);
    } catch (cleanupError) {
      console.error(`[TEST-RLS] Lỗi khi dọn dẹp dữ liệu:`, cleanupError);
    }
    await prisma.$disconnect();
  }
}

testRls();
