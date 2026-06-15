# IELTS Vocabulary Web App

Ứng dụng học từ vựng IELTS với hệ thống ôn tập thông minh (SRS).

## Tech Stack

- **Frontend**: Next.js 16 (App Router)
- **Styling**: TailwindCSS
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma 5

## Tính năng

- Học từ vựng theo chủ đề (9 chủ đề IELTS)
- Hệ thống ôn tập thông minh (SM-2 Algorithm)
- Lọc theo mức độ (A1-C2)
- Dashboard theo dõi tiến độ

## Setup

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình Database (Neon SQL)

Tạo project mới trên [Neon Console](https://console.neon.tech) và lấy connection string:

```bash
# Copy .env.example thành .env
cp .env.example .env

# Cập nhật DATABASE_URL với connection string từ Neon
DATABASE_URL="postgresql://user:password@host.neon.tech/neondb?sslmode=require"
```

### 3. Push database schema

```bash
npx prisma db push
```

### 4. Seed dữ liệu

```bash
npm run db:seed
```

### 5. Chạy development server

```bash
npm run dev
```

## Deploy lên Vercel

1. Push code lên GitHub
2. Import project trên [Vercel](https://vercel.com)
3. Thêm Environment Variable `DATABASE_URL` với connection string từ Neon
4. Deploy!

## API Endpoints

- `GET /api/words` - Lấy danh sách từ (hỗ trợ filter theo topic, level, search)
- `GET /api/words/[id]` - Lấy chi tiết một từ
- `PATCH /api/words/[id]` - Cập nhật SRS data
- `GET /api/review` - Lấy từ cần ôn tập hôm nay

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
npm run db:seed  # Seed database
```