# Kiểm tra giao diện và tương tác — 31/10/2026

## Phần thay đổi

Màn phát âm được chia thành từ mẫu và khu ghi âm: IPA, nghĩa đã kiểm duyệt nếu có, nghe mẫu/nghe chậm, ví dụ mở rộng, nút ghi âm có nhãn, đồng hồ 10 giây, nghe lại bản thu, lỗi quyền micro và hủy request khi đổi từ. Bộ sưu tập được áp dụng thật với kiểm tra quyền; không còn chỉ dùng collectionId làm đường quay lại. Định dạng bản thu giữ MIME của trình duyệt (WebM/Ogg/MP4), giải phóng micro và Blob URL khi rời trang.

Điểm cũ dựa trên Levenshtein của bản chép chữ, không đo âm vị. Nay UI ghi rõ phần trăm khớp từ nhận diện, không tuyên bố đây là đánh giá phát âm chi tiết hoặc độ giống người bản xứ. Phản hồi hỗ trợ người học, bỏ các câu AI châm chọc và phụ thuộc NVIDIA cho bước đối chiếu chữ. Không thay SRS hoặc tự đánh dấu thành thạo.

Các game ngoài và route phòng có khung mở rộng toàn vùng trình duyệt, cùng nút Fullscreen. Ong Chính Tả có nhân vật SVG riêng, trạng thái nghe/đúng/sai, ô chữ và nghe lại. Mưa Từ Vựng có mục tiêu nghĩa rơi, cảnh mưa, vạch đáy và ô chữ đang nhập. Dùng token theme, giữ luồng chọn nguồn và lưu kết quả hiện có; không sao chép asset/code game Parroto. Có chế độ không áp lực và nhanh 60 giây/3 lượt; nguồn theo chặng giữ yêu cầu qua chặng. Enter gửi câu trả lời, focus sang tiếp theo; chốt nộp/đổi câu ngăn thao tác trùng.

Chủ phòng chỉ điều hành: xem [rooms.md](rooms.md). Kho tham khảo và dữ liệu đã đọc: [PARROTO-VOCABULARY-AUDIT.md](PARROTO-VOCABULARY-AUDIT.md). Kế hoạch đối chiếu chống trùng tách khỏi code game, chưa nhập production; xem [VOCABULARY-IMPORT-PLAN.md](VOCABULARY-IMPORT-PLAN.md).

## Kiểm chứng

- TypeScript và Next production build thành công. Build còn cảnh báo convention middleware và Edge Runtime từ code hiện có; chưa đổi phạm vi này.
- ESLint tập tin thay đổi, kiểm tra khoảng trắng git diff.
- Regression room engine/modes/poll/lifecycle; test PostgreSQL nguồn/quyền, private result, exact replay, chuyển host, rematch, reconnect và đủ 40 người.
- HTTP đăng nhập Credentials bình thường với ba tài khoản QA: host không có đáp án/điểm/lượt ôn; hai người chơi nhận kết quả riêng; các quyền và generation guard được thực thi server.
- Regression đối chiếu chữ nhận diện, dữ liệu rỗng/dấu câu và MIME ghi âm.
- REA thực hiện 10 luồng desktop/mobile, light/dark trong database QA cách ly: phát âm và lỗi micro bị từ chối; Ong trả lời Enter, 3 câu sai, lưu kết quả và luyện lại đúng 3 câu; tạm dừng/Fullscreen; Mưa từ và phản hồi; tạo phòng host riêng. Không có page-error/consoleerror trong các luồng đó. Đã phát hiện và sửa nút trả lời desktop nằm dưới màn hình và hint sức chứa tính cả host. Theo phản hồi ảnh localhost, tiếp tục đổi Ong/Mưa sang một sân chơi phủ toàn vùng còn lại: HUD nằm trong sân, ô nhập ghim đáy, khoảng rơi đo bằng ResizeObserver theo chiều cao mục tiêu/khối nhập thay vì một chiều cao px cố định. VisualViewport được theo dõi khi bàn phím di động làm vùng nhìn nhỏ lại.

## Giới hạn

Không kiểm chứng chất lượng phát âm bằng giọng người thật hoặc thiết bị micro thật. Trình duyệt headless có chặn phát âm thanh; ứng dụng hiện cảnh báo và nút nghe lại, không lấy đó làm bằng chứng đã nghe được tiếng. Bàn phím được kiểm tra bằng thao tác REA, chưa thử bàn phím ảo trên thiết bị iOS/Android thật. Nội dung Parroto chỉ được xuất thành artifact cục bộ để đối chiếu; không nhập nghĩa/audio/ví dụ của họ vào production. Không có migration database mới cho thay đổi host: dữ liệu mở rộng trong JSON state, hỗ trợ phòng cũ.

Ảnh và Evidence QA trong .drafts/current-qa-* và .drafts/final-qa-*, được git bỏ qua; không dùng ảnh của lượt cũ làm bằng chứng giao diện mới.

Kiểm tra lại sau chỉnh sân: REA quan sát sân Ong/Mưa ở 1920×1080 phủ toàn vùng còn lại; Ong mobile 390×844 có đủ ô nhập/nút, Evidence ev_e1bb279edfe825fffd64da6aaa07b82951e6d4e8ecf59adb46690b27982b5f1f. Mưa desktop tối 1280×800 gửi đáp án bằng Enter và nhận phản hồi, Evidence ev_34bce03afb166c858ff18ce702e33343d956e0fc30be8b9e8d07c92425d27b54. Không có page-error; các browser do REA tạo đều đã kết thúc. Nút ghi âm mobile đã kiểm tra hiện đầy đủ trên màn đầu 390×844, trên thanh điều hướng đáy.
