# Triển khai phần quyền riêng tư

Áp dụng schema trước khi bật ghi nhật ký đồng ý trên máy chủ và tác vụ dọn phòng. Dùng biến môi trường DATABASE_URL của app và ADMIN_DATABASE_URL cùng trỏ vào database đích.

```powershell
npx tsx scripts/setup-privacy.ts
```

Migration bổ sung bảng VoiceConsent và quyền dọn phòng giới hạn theo thời điểm hết hạn. Chạy lại an toàn. API nhận diện dừng trước khi gửi file nếu ghi nhận đồng ý thất bại. Cron hiện có dọn phòng hết hạn trên 24 giờ khi CRON_SECRET được cấu hình và lịch chạy thành công.

Kênh yêu cầu dữ liệu sử dụng hộp thư hỗ trợ hiện có. Đội vận hành cần theo dõi hộp thư, xác minh danh tính theo từng yêu cầu và xử lý theo hạn tương ứng. Cấu hình thời hạn lưu dữ liệu tại các nhà cung cấp nằm ngoài đợt triển khai này.
