# Phòng thi đấu từ vựng

- Từ 2 đến 8 người, mã phòng 6 ký tự. Chọn 5/10/15/20/30/50 câu và 10/15/20 giây mỗi câu.
- Chủ phòng bắt đầu khi mọi người sẵn sàng. Cùng lịch câu hỏi theo đồng hồ máy chủ; có 3 giây công bố đáp án giữa các câu.
- Trả lời đúng được 100 điểm và thêm tối đa 50 điểm theo thời gian còn lại. Mỗi người chỉ có một câu trả lời mỗi vòng; máy chủ tính điểm.
- Bảng điểm công bố sau mỗi câu. API không gửi đáp án đúng hay điểm của câu đang diễn ra trước thời điểm công bố.
- Trạng thái nằm trong PostgreSQL, không phụ thuộc bộ nhớ của một instance Vercel. Giao diện lấy trạng thái mỗi 1,5–3 giây, giãn còn 12 giây khi tab ẩn. Không cần dịch vụ trả phí bổ sung.

## Cài đặt

Chạy `npx tsx scripts/setup-rooms.ts` ở thư mục dự án, với `ADMIN_DATABASE_URL` và `DATABASE_URL` trong môi trường. Script chỉ thêm hai bảng phòng/rate limit, chính sách RLS và quyền tối thiểu cho role ứng dụng. Không chạy lệnh reset hay `db push --accept-data-loss`.

Schema Prisma ghi lại cấu trúc tương ứng; chạy `prisma generate` sau khi cài dependency như bình thường. Mã runtime dùng truy vấn có tham số và transaction để đặt context người dùng/mã phòng. Transaction khóa hàng khi cập nhật để tránh trả lời hoặc vượt giới hạn người chơi do thao tác đồng thời.

Phòng hết hạn sau hai giờ; bắt đầu trận sẽ gia hạn hai giờ. Đóng tab không tự rời phòng, cho phép người chơi kết nối lại bằng cùng tài khoản và mã. Chủ phòng rời sảnh chờ sẽ đóng phòng. Phòng kết thúc không nhận người chơi mới. Dữ liệu phòng hết hạn có thể dọn định kỳ bằng tài khoản quản trị; ứng dụng không cấp quyền xóa bảng cho role runtime.

## Kiểm tra

`npx tsx scripts/test-room-engine.ts` kiểm tra thời gian vòng, điểm, ẩn đáp án, membership và từ chối trả lời trùng/muộn. Khi thay đổi API cần kiểm tra thêm với hai tài khoản riêng, quyền bắt đầu của chủ phòng, giới hạn tám người và khôi phục sau mất kết nối.
