# IELTS Vocabulary Web App

Ứng dụng học từ vựng IELTS với hệ thống ôn tập thông minh (SRS) và các trò chơi luyện tập tương tác độc đáo theo phong cách Neo-brutalism.

## Công Nghệ Sử Dụng (Tech Stack)

- **Frontend**: Next.js 16 (App Router)
- **Styling**: TailwindCSS & PostCSS 4
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Prisma 5
- **Authentication**: NextAuth.js (v5 Beta)
- **AI Engine**: NVIDIA Llama 3.1 API (cho phần AI Mỏ Hỗn)
- **Speech Engine**: Edge TTS (cho phát âm từ vựng chất lượng cao)

## Các Tính Năng Nổi Bật

### 1. Hệ thống ôn tập thông minh (SRS)
- Áp dụng thuật toán SM-2 (SuperMemo-2) để tối ưu hóa thời gian lặp lại ngắt quãng của từ vựng.
- Dashboard theo dõi tiến độ và đề xuất số lượng từ cần học/ôn tập hàng ngày.
- Lịch sử học tập hiển thị dưới dạng Heatmap (giống Github Contribution Calendar) giúp theo dõi tần suất học.

### 2. Kho từ vựng đa dạng
- Hỗ trợ học theo nhiều chủ đề IELTS phổ biến.
- Phân chia từ vựng theo các mức độ từ cơ bản đến nâng cao (A2 - C2).
- Tích hợp phát âm chuẩn giọng bản xứ thông qua Edge TTS.

### 3. Hệ thống 5 Minigame Luyện Tập
- **Speedrun (Tốc chiến)**: Chọn nhanh nghĩa chính xác của từ vựng dưới áp lực thời gian.
- **Blockblast (Xếp hình)**: Kết hợp học từ vựng và xếp khối màu sắc phong cách Block Blast.
- **Sniper (Thiện xạ)**: Trò chơi ngắm bắn các từ vựng đúng.
- **Match (Lật thẻ)**: Trò chơi trí nhớ lật các thẻ từ tiếng Anh và nghĩa tiếng Việt tương ứng.
- **AI Mỏ Hỗn (Pronounce Challenge)**: Thử thách phát âm từ vựng bằng giọng đọc của học sinh. Hệ thống sử dụng mô hình Llama 3.1 để trả về nhận xét cà khịa, mỉa mai xéo xắt cực kỳ vui nhộn (khen kiểu khịa khi đọc tốt và chê thẳng mặt khi đọc sai) với các ngôi xưng hô thay đổi linh hoạt.

### 4. Đăng nhập & Bảo mật
- Hỗ trợ đăng nhập bằng tài khoản (Email/Password) hoặc thông qua Google OAuth.
- Middleware tự động kiểm tra quyền và bảo vệ các tuyến đường (protected routes), tự động redirect 307 chính xác.

### 5. Góp ý & Báo lỗi
- Cung cấp hộp thoại phản hồi trực tiếp giúp người học báo lỗi hệ thống, góp ý từ vựng hoặc đề xuất tính năng mới gửi trực tiếp về email quản trị viên.

## Hướng Dẫn Cấu Hình (Environment Variables)

Tạo tệp `.env` (hoặc `.env.local`) ở thư mục gốc và khai báo các biến môi trường sau:

```bash
# Kết nối cơ sở dữ liệu Neon PostgreSQL
DATABASE_URL="postgresql://user:password@host.neon.tech/neondb?sslmode=require"
ADMIN_DATABASE_URL="postgresql://user:password@host.neon.tech/neondb?sslmode=require"

# Khóa API của NVIDIA (sử dụng cho AI Mỏ Hỗn)
NVIDIA_API_KEY="your-nvidia-api-key"

# Cấu hình NextAuth
AUTH_SECRET="your-next-auth-secret-key"

# Google OAuth (Tùy chọn đăng nhập bằng Google)
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# Cấu hình SMTP Mail (Gửi phản hồi/feedback)
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-specific-password"
FEEDBACK_RECEIVER_EMAIL="your-receiver-email@gmail.com"
```

## Hướng Dẫn Cài Đặt & Chạy Cục Bộ

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Đồng bộ Database Schema với Prisma
```bash
npx prisma db push
```

### 3. Nạp dữ liệu từ vựng ban đầu (Seed)
```bash
npm run db:seed
```

### 4. Khởi chạy Development Server
```bash
npm run dev
```

## Các Câu Lệnh CLI Tiện Ích

- `npm run dev`       # Chạy máy chủ phát triển cục bộ
- `npm run build`     # Biên dịch dự án cho môi trường production
- `npm run start`     # Khởi chạy ứng dụng production sau khi build
- `npm run lint`      # Kiểm tra và sửa lỗi coding convention bằng ESLint
- `npm run db:seed`   # Seed dữ liệu từ vựng vào database
- `npm run ai:improve` # Chạy script tối ưu hóa/sửa lỗi tự động cho kho từ vựng