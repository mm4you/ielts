# Phòng thi đấu từ vựng

- Từ 2 đến 8 người, mã phòng 6 ký tự. Chủ phòng chọn chế độ trước khi tạo: Trắc nghiệm, Tốc chiến, Lật thẻ, Thiện xạ, Xếp hình hoặc Chíu chíu luyện gõ.
- Trắc nghiệm giữ luật theo vòng: 5/10/15/20/30/50 câu, 10/15/20 giây mỗi câu và 3 giây công bố đáp án. Đúng được 100 điểm, thưởng tối đa 50 điểm theo thời gian; chỉ công bố điểm sau mỗi câu.
- Năm game còn lại dùng cùng bộ từ và cùng giờ bắt đầu, mỗi người tiến lên theo tốc độ riêng. Chọn 60/90/120/180 giây cho trận. Kết thúc khi hết giờ hoặc tất cả đã hoàn thành/hết lượt. Rời tab không tạm dừng trận nhiều người.
- Tốc chiến: trắc nghiệm liên tiếp, đúng được 100 điểm và thưởng combo tăng 10 điểm mỗi lần, tối đa 50. Sai mất combo.
- Lật thẻ: các bàn tối đa 6 cặp, cùng thứ tự thẻ cho mọi người. Máy chủ chỉ gửi nội dung thẻ đang lật/đã ghép của chính người chơi. Sai úp lại sau 900 ms; ghép đúng được 100 điểm và tối đa 50 điểm tốc độ. Hoàn thành bàn sẽ mở bàn tiếp theo.
- Thiện xạ: đọc nghĩa, bắn một trong bốn từ tiếng Anh đang di chuyển. Chíu chíu: gõ đủ từ đang rơi để tự bắn. Cả hai có 3 lượt/lá chắn và 10/15/20 giây mỗi mục tiêu. Máy chủ trừ lượt/đổi mục tiêu theo thời gian, kể cả khi mất kết nối. Đúng được 100 điểm và thưởng combo tối đa 50.
- Xếp hình: bàn 8×8, mỗi bộ 3 khối giống nhau giữa người chơi. Chọn khối rồi chọn ô đặt; 5 điểm/ô, 100 điểm/hàng hoặc cột đầy. Hết bộ trả lời từ vựng để nhận bộ tiếp theo; sai thêm ô chặn. Không còn vị trí đặt thì hết lượt. Máy chủ kiểm tra hình dạng, va chạm, xóa hàng/cột và tính điểm.
- API chỉ gửi màn chơi hiện tại của người yêu cầu, không gửi câu/đáp án tương lai hoặc trạng thái riêng của đối thủ. Điểm của năm game được cập nhật trong trận. Mỗi thao tác có revision, khóa hàng PostgreSQL chống gửi trùng và xung đột; không nhận điểm từ client. Giới hạn 180 thao tác/phút/người, tối đa 10 phòng/giờ.
- Trạng thái nằm trong PostgreSQL, không phụ thuộc bộ nhớ của một instance Vercel. Giao diện lấy trạng thái mỗi 1,5–3 giây, giãn còn 12 giây khi tab ẩn. Không cần dịch vụ trả phí bổ sung.

## Cài đặt

Chạy `npx tsx scripts/setup-rooms.ts` ở thư mục dự án, với `ADMIN_DATABASE_URL` và `DATABASE_URL` trong môi trường. Script chỉ thêm hai bảng phòng/rate limit, chính sách RLS và quyền tối thiểu cho role ứng dụng. Không chạy lệnh reset hay `db push --accept-data-loss`.

Schema Prisma ghi lại cấu trúc tương ứng; chạy `prisma generate` sau khi cài dependency như bình thường. Mã runtime dùng truy vấn có tham số và transaction để đặt context người dùng/mã phòng. Transaction khóa hàng khi cập nhật để tránh trả lời hoặc vượt giới hạn người chơi do thao tác đồng thời.

Phòng hết hạn sau hai giờ; bắt đầu trận sẽ gia hạn hai giờ. Đóng tab không tự rời phòng, cho phép người chơi kết nối lại bằng cùng tài khoản và mã. Chủ phòng rời sảnh chờ sẽ đóng phòng. Phòng kết thúc không nhận người chơi mới. Dữ liệu phòng hết hạn có thể dọn định kỳ bằng tài khoản quản trị; ứng dụng không cấp quyền xóa bảng cho role runtime.

## Kiểm tra

`npx tsx scripts/test-room-engine.ts` kiểm tra chế độ Trắc nghiệm và phòng cũ không có trường mode. `npx tsx scripts/test-room-modes.ts` kiểm tra năm game, giấu thẻ/đáp án, tiến độ độc lập, revision, hết giờ/lượt, tính combo và va chạm/xóa hàng. Khi thay đổi API cần kiểm tra thêm với các tài khoản riêng, quyền bắt đầu của chủ phòng, giới hạn tám người, thao tác đồng thời và khôi phục sau mất kết nối.

Các trường chế độ/tiến độ nằm trong JSON state hiện có; không cần sửa bảng hoặc chạy migration cho bản nâng cấp này. Phòng cũ mặc định là Trắc nghiệm.
