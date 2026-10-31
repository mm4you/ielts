# Kế hoạch ghép bộ từ tham khảo vào thư viện

Đối chiếu ngày 31/10/2026 (Asia/Saigon), ở chế độ **chỉ đọc**. Chưa nhập từ hoặc tạo bộ trong database production.

## Kết quả thực tế

Nguồn từ báo cáo [Parroto](./PARROTO-VOCABULARY-AUDIT.md) có 6.841 thẻ của 9 bộ miễn phí / 267 nhóm, tương ứng 4.748 tên từ/cụm từ khác nhau. Khi tách từ loại, có **4.936 mục từ + từ loại**. Cùng một tên từ có thể có cả danh từ và động từ nên hai con số này khác nhau.

Thư viện hiện có **6.174 bản ghi Word**, trong đó có **17 nhóm tên từ đã có nhiều bản ghi**. Bản đối chiếu không tự gộp hoặc xóa những bản ghi cũ này.

| Phân loại | Số mục từ + từ loại | Cách xử lý |
| --- | ---: | --- |
| Ứng viên dùng lại Word ID hiện có | 1.082 | Khớp tên từ chuẩn hóa và từ loại, chỉ có một bản ghi cũ. Cần đối chiếu đúng nghĩa trước khi công bố. |
| Cần kiểm tra thủ công | 334 | Có nhiều bản ghi cùng tên, thiếu/không hiểu từ loại, hoặc từ loại không khớp. Không tự chọn một ID. |
| Chưa có trong thư viện | 3.520 | Chỉ lập mục nháp; tương ứng 3.411 tên từ/cụm từ. Chưa có nghĩa, IPA, ví dụ được kiểm tra để dùng làm nội dung luyện. |

Tổng 1.082 + 334 + 3.520 = 4.936 mục từ + từ loại. Không cộng các con số này rồi diễn giải thành 4.748 tên từ.

**Số thao tác ghi database: 0.** Mã đọc dùng DATABASE_URL của ứng dụng và SET TRANSACTION READ ONLY; chỉ lấy metadata từ vựng (ID, từ, từ loại, cấp độ, chủ đề và trạng thái duyệt). Không đọc thông tin người dùng hoặc tiến độ học.

## Cách tránh trùng và xung đột

1. Chuẩn hóa Unicode NFKC, chữ thường, khoảng trắng và dấu nháy cong. Không sửa từ gốc trong thư viện.
2. Chuẩn hóa các nhãn từ loại đã biết: noun/n./Danh từ, verb/v./Động từ, adjective/adj./Tính từ… Nhãn kết hợp như noun / verb được giữ để kiểm tra, không suy diễn.
3. Không gộp bằng độ giống chữ, từ đồng nghĩa, số ít/số nhiều, dấu gạch nối hoặc khác biệt Anh–Mỹ. color và colour, well being và well-being không tự nhập thành một từ.
4. Nếu tên từ chỉ có một bản ghi và từ loại khớp, lập liên kết ứng viên tới ID đó. Nếu có nhiều bản ghi cùng tên thì cần kiểm tra thủ công, kể cả khi một bản ghi có từ loại gần phù hợp.
5. Mỗi thẻ nguồn có khóa ổn định theo origin nguồn + ID thẻ. Quan hệ bộ/nhóm dùng khóa riêng. Một từ xuất hiện ở ba bộ vẫn có thể trỏ về cùng Word ID; không cần tạo ba Word.
6. Hai dòng cùng ID thẻ nhưng khác từ/từ loại khiến công cụ dừng, không chọn bản mới nhất âm thầm.

Khớp chữ và từ loại chưa chứng minh khớp nghĩa: school có thể là trường học hoặc đàn cá. Vì nguồn đang giữ chỉ tên từ/từ loại, **mọi ứng viên dùng lại vẫn cần duyệt nghĩa phù hợp**. Không ghi đè nghĩa, IPA, ví dụ, cấp độ hoặc chủ đề cũ chỉ để khớp bộ tham khảo.

## Bản kế hoạch cục bộ

- E:/ielts-vocab/.drafts/parroto/import-plan.json: từng mục từ, ứng viên Word ID, lý do cần duyệt, nguồn thẻ và quan hệ 9 bộ / 267 nhóm.
- E:/ielts-vocab/.drafts/parroto/import-plan-summary.md: số liệu tổng hợp.
- Artifact có SHA-256 file nguồn và snapshot metadata thư viện để phát hiện đầu vào thay đổi trước một lần áp dụng sau này.

Mỗi nhóm giữ candidateWordIds và pendingEntryKeys riêng. suggestedStages chia các ID ứng viên thành chặng tối đa 10 từ để xem trước cấu trúc, **publishable luôn false**. Không bỏ các từ đang chờ duyệt rồi công bố một bộ bị thiếu như thể đã đủ.

Các artifact được git bỏ qua, không đóng gói cùng ứng dụng và không tự tải vào production.

## Chạy lại đối chiếu

Đọc database của dự án, không có chế độ ghi:

~~~powershell
npx tsx scripts/plan-vocabulary-import.ts --source .drafts/parroto/free-full-inventory.json --database
~~~

Hoặc dùng snapshot JSON là một mảng các bản ghi có id, word, pos (level/topic/reviewStatus tùy chọn), hoàn toàn không kết nối database:

~~~powershell
npx tsx scripts/plan-vocabulary-import.ts --source .drafts/parroto/free-full-inventory.json --library .drafts/library-snapshot.json --out .drafts/parroto/offline-plan.json
~~~

Công cụ từ chối tham số lạ như --apply và chỉ ghi báo cáo dưới .drafts. Đầu vào phải là các bộ được khai báo miễn phí, thẻ có ID bộ/nhóm hợp lệ và URL đúng bộ. Không có dữ liệu PRO trong kế hoạch này.

## Trước khi đưa vào ứng dụng

Duyệt các liên kết ứng viên và mục chưa rõ từ loại/nghĩa; bổ sung nội dung được kiểm tra cho các từ mới. Sau đó chuẩn bị manifest gồm Word ID đã duyệt và khóa nguồn ổn định. Bộ/chặng mới chỉ liên kết các ID đó qua quan hệ hiện có; không chèn lại tất cả thẻ nguồn vào Word.

Một công cụ áp dụng sau này cần kiểm tra snapshot còn khớp, dùng transaction, khóa chống chạy đồng thời và khóa nguồn duy nhất để chạy lại không sinh bản ghi trùng. Hiện chưa tạo công cụ áp dụng, chưa có migration mới và chưa đổi schema. Không nên thêm ràng buộc unique(word) đơn giản: thư viện có từ đồng hình/từ đa nghĩa và 17 nhóm trùng cần được xử lý có chủ đích.

Việc thêm từ/bộ không tự tạo UserProgress, tăng độ thành thạo, cập nhật lịch SRS hoặc sửa checkpoint đang học. Khi công bố bộ mới, việc học chỉ phát sinh sau khi người dùng chọn luyện thật.

## Kiểm chứng

npx tsx scripts/test-vocabulary-import-plan.ts đã qua các ca: Unicode/dấu nháy, từ loại Việt/Anh, nhiều ứng viên, thiếu từ loại, khác từ loại, khác biệt Anh–Mỹ/gạch nối, khóa nguồn ổn định, lặp thẻ, một từ nhiều nhóm, đầu vào PRO/nhóm/URL sai, thẻ cùng ID xung đột, và giữ nguyên dữ liệu thư viện đầu vào. ESLint cho ba file công cụ/kiểm thử không có lỗi hoặc cảnh báo.
