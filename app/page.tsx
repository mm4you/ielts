import NavLayout from '@/components/NavLayout';

export default function HomePage() {
  return (
    <NavLayout>
      <section className="text-center py-20">
        <h1 className="text-4xl font-bold text-[var(--primary)] mb-4">
          Chào mừng đến với IELTS Vocabulary
        </h1>
        <p className="text-[var(--muted)] text-lg">
          Ứng dụng học từ vựng IELTS với hệ thống ôn tập thông minh.
        </p>
      </section>
    </NavLayout>
  );
}
