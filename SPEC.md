# IELTS Vocabulary Web App (MVP Spec)

## 1. Overview

Build a minimal web app for learning IELTS vocabulary with focus on:

- Simple UI (clean, minimal, fast)
- Daily vocabulary review
- Spaced repetition system (SRS)
- Topic-based learning
- Progress tracking

No gamification. No complexity. Focus on learning efficiency.

---

## 2. Tech Stack (suggested)

- Frontend: Next.js (React)
- Styling: TailwindCSS (minimal design system)
- Backend: Node.js (or Next API routes)
- Database: SQLite (MVP) → PostgreSQL later
- ORM: Prisma (recommended)
- Auth: Optional (can skip MVP)

---

## 3. Core Features

### 3.1 Vocabulary System

Each word contains:

- word (string)
- ipa (string)
- meaning_vi (string) - Vietnamese meaning
- example (string)
- synonyms (string[])
- topic (string)
- level (A1–C1 or IELTS band mapping)
- review_status (new / learning / known)

---

### 3.2 Topics

Predefined topics:

- Education / Giáo dục
- Environment / Môi trường
- Technology / Công nghệ
- Health / Sức khỏe
- Crime / Tội phạm
- Government / Chính phủ
- Work / Công việc
- Culture / Văn hóa
- Globalization / Toàn cầu hóa

User can filter vocabulary by topic.

---

### 3.3 Spaced Repetition System (SRS)

Each word has:

- ease_factor (float)
- interval_days (int)
- next_review_date (date)
- repetition_count (int)

Logic (SM-2 Algorithm):

- User marks:
  - "Quên" (Forgot)
  - "Khó" (Hard)
  - "Tốt" (Good)
  - "Dễ" (Easy)

Update scheduling accordingly.

---

### 3.4 Daily Review

Home screen shows:

- Words due today
- Button: "Bắt đầu ôn tập" (Start Review)

Review flow:

1. Show word
2. Show meaning after click
3. User rates memory level
4. Save result → update SRS

---

### 3.5 Dashboard

Minimal stats:

- Total words learned
- Words mastered
- Words due today
- Streak (days)

Example UI:

- Clean cards
- No animations required

---

## 4. Pages

### 4.1 Home (/)

- Daily review summary
- Start Review button
- Simple progress stats

---

### 4.2 Review (/review)

- One word per screen
- Show:
  - word
  - button "Hiện nghĩa" (show meaning)
  - example sentence
- Buttons:
  - Quên (Forgot)
  - Khó (Hard)
  - Tốt (Good)
  - Dễ (Easy)

---

### 4.3 Library (/library)

- List all words
- Filter by topic
- Search bar

---

### 4.4 Word Detail (/word/[id])

- Full vocabulary info
- synonyms
- example
- topic
- level

---

## 5. UI Style Guide

### Design Principles

- Minimal
- High readability
- No clutter
- White space important

### Colors

Light mode:

- Background: #f5f7fa
- Text: #222222
- Primary: #4f7cff
- Border: #e5e7eb

Dark mode (optional):

- Background: #111827
- Card: #1f2937
- Text: #f3f4f6
- Primary: #60a5fa

### Typography

- Font: Inter
- Large readable text
- No decorative fonts

---

## 6. Database Schema

```sql
Table: words

id INTEGER PRIMARY KEY
word TEXT
ipa TEXT
meaning_vi TEXT
example TEXT
synonyms TEXT
topic TEXT
level TEXT

ease_factor FLOAT
interval_days INTEGER
repetition_count INTEGER
next_review_date DATE

created_at TIMESTAMP
updated_at TIMESTAMP
```

---

## 7. Vietnamese Localization

All UI text should be in Vietnamese by default:

- Navigation: Trang chủ, Thư viện, Ôn tập
- Buttons: Bắt đầu ôn tập, Hiện nghĩa, Quên, Khó, Tốt, Dễ
- Labels: Từ vựng, Chủ đề, Mức độ, Ví dụ, Từ đồng nghĩa
- Stats: Tổng số từ, Đã thuộc, Cần ôn hôm nay, Chuỗi ngày