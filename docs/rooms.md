# Phòng thi đấu từ vựng

- Từ 2 đến 40 người, mặc định 8, mã phòng 6 ký tự. Chủ phòng chọn chế độ trước khi tạo: Trắc nghiệm, Tốc chiến, Lật thẻ, Thiện xạ, Xếp hình hoặc Chíu chíu luyện gõ.
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

Phòng hết hạn sau hai giờ; bắt đầu trận sẽ gia hạn hai giờ. Đóng tab không tự rời phòng, cho phép người chơi kết nối lại bằng cùng tài khoản và mã. Chủ phòng chủ động rời sẽ chuyển quyền cho người còn tham gia; hết người thì phòng đóng. Phòng kết thúc không nhận người chơi mới cho đến khi chủ phòng chuẩn bị lượt tiếp theo. Dữ liệu phòng hết hạn có thể dọn định kỳ bằng tài khoản quản trị; ứng dụng không cấp quyền xóa bảng cho role runtime.

## Kiểm tra

`npx tsx scripts/test-room-engine.ts` kiểm tra chế độ Trắc nghiệm và phòng cũ không có trường mode. `npx tsx scripts/test-room-modes.ts` kiểm tra năm game, giấu thẻ/đáp án, tiến độ độc lập, revision, hết giờ/lượt, tính combo và va chạm/xóa hàng. Giới hạn 40 người và cạnh tranh chỗ cuối được kiểm tra trong `test-local-integration.ts` trên PostgreSQL riêng.

Các trường chế độ/tiến độ nằm trong JSON state hiện có; không cần sửa bảng hoặc chạy migration cho bản nâng cấp này. Phòng cũ mặc định là Trắc nghiệm.

## Năm phần mở rộng — 31/10/2026

1. Chủ phòng chọn kho từ hoặc bộ sưu tập, chủ đề và cấp độ. Quyền bộ cá nhân/công khai được kiểm tra khi chọn và khi bắt đầu; thiếu từ phù hợp thì báo số lượng, không lấy bù từ nguồn khác. Những từ được chọn sẽ được chia sẻ với thành viên phòng; UI nêu rõ điều này. Nếu chuyển quyền sang người không được đọc bộ cá nhân cũ, chủ phòng mới phải chọn lại nguồn.
2. Chơi lại giữ mã phòng và người chưa chủ động rời. Có thể đổi chế độ/bộ từ/số câu/thời gian. Mỗi lượt có `roundId` mới; yêu cầu sẵn sàng, trả lời hoặc chơi từ lượt cũ bị chặn. Chơi lại gửi trùng không đặt lại trận lần thứ hai. Cài đặt mới yêu cầu mọi người sẵn sàng lại.
3. Ghi nhận từ sai/bỏ lỡ, cặp ghép từng sai rồi sửa được và các từ chưa kịp luyện. Chỉ người sở hữu xem được kết quả riêng. Kết quả sử dụng snapshot từ/câu trả lời có `wordId` và ID lượt riêng, được lưu vào `PracticeSession` mode `rooms` trước khi xóa trạng thái trận cũ. Người quay lại sau chơi lại có liên kết tới kết quả trận trước. Luyện lại qua Ong Chính Tả lấy đúng ID từ cần luyện, không trộn ngẫu nhiên. Danh sách từ sai chung có mục Phòng thi đấu; luyện đúng tập này giải quyết lỗi tương ứng, không thay lịch SRS/thành thạo.
4. Chủ phòng có thể mời người ra ở sảnh hoặc sau trận; người bị mời không thể tái gia nhập bằng cùng mã. Chuyển quyền cho một thành viên còn trong phòng được phép trong trận. Chủ phòng rời chủ động sẽ nhường quyền; mất mạng chỉ hiển thị cảnh báo/thử lại, không tự suy đoán người đó đã bỏ phòng. Vào lại giữ tiến độ và thời hạn; trận nhiều người không tạm dừng. Trận đã kết thúc không hồi sinh khi thành viên vào lại.
5. Bảng điểm có nhóm dẫn đầu, vị trí riêng của bạn, thứ hạng đồng điểm và mức tăng/giảm hạng. Trắc nghiệm chỉ công bố điểm/hạng sau câu, so với trước câu vừa công bố. Các game độc lập hiển thị thay đổi của lượt ghi điểm gần nhất. Người chơi không gửi điểm từ client.

Phần ôn từ cần các bảng study đã áp dụng trong đợt rollout trước (`PracticeSession`, `WordMistake`, `StudyWordDay`, `StudyPreference` và bộ đếm DailyActivity). Không thêm schema/migration mới ở đợt phòng này. Trận đang chạy từ bản cũ thiếu `wordId` vẫn chơi được, nhưng UI nói rõ chưa có danh sách ôn lại. Không tự chuyển đổi lịch sử thiếu dữ liệu thành kết quả giả.

## Kết quả kiểm thử đợt mở rộng

- `test-room-lifecycle.ts`: giấu điểm/đáp án, đồng hạng và tăng/giảm hạng, kết thúc cố định, hết hạn mục tiêu, ghép sai rồi sửa, tương thích phòng cũ, reset sẵn sàng và quyền chủ phòng.
- `test-room-features.ts`: PostgreSQL riêng, role ứng dụng không bypass RLS; bộ từ riêng/công khai/ít/rỗng/bộ lọc, lượt cũ, kết quả cá nhân/idempotent, tập luyện lại đúng, chơi lại, lưu cho người offline, chuyển quyền/rời phòng, mời ra/cấm vào lại và kết nối lại giữ tiến độ. Lưu kết quả và reset đủ 40 người đã qua; thời gian local khoảng 0,1 giây, không coi đó là benchmark production.
- `test-room-http.ts`: hai tài khoản đăng nhập Credentials bình thường, API nguồn từ/quyền/roundId/giấu đáp án/lịch sử riêng/luyện lại/đổi trận/tiếp tục polling/chuyển quyền/mời ra. Chỉ chỉnh đồng hồ của phòng fixture trong database QA để kiểm tra kết thúc mà không chờ thật.
- Các bài test study, exercises, typing, room engine/modes/poll được chạy hồi quy; TypeScript, build và lint phần thay đổi được kiểm tra.
- Công cụ CUA và Node REPL đều không khởi tạo được, trả `failed to write kernel assets: ... path ... (os error 3)`, kể cả sau reset. Vì vậy chưa xác minh giao diện thực tế desktop/mobile, sáng/tối, bàn phím và focus menu/dialog trong lượt này. Không dùng HTTP/build để tuyên bố đã kiểm tra UI. Đã dùng Fluent và theme chung; cần kiểm tra trình duyệt khi công cụ hoạt động lại.

Các tài khoản, thời gian mô phỏng, dữ liệu fixture và kiểm thử tải chỉ dùng cluster QA loopback riêng. Không đưa fixture vào production, không sửa tài khoản hay SRS production và không gửi email.
