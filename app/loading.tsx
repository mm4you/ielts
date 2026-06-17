export default function Loading() {
  return (
    <div className="fixed inset-0 bg-[var(--bg)] z-[100] flex flex-col items-center justify-center">
      <div className="relative w-24 h-24 md:w-32 md:h-32 animate-bounce">
        <div className="absolute top-0 left-0 w-16 h-16 md:w-24 md:h-24 bg-[var(--blue)] border-[4px] border-[var(--ink)] rounded-xl"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 md:w-24 md:h-24 bg-[var(--yellow)] border-[4px] border-[var(--ink)] rounded-xl flex items-center justify-center">
          <span className="text-4xl md:text-6xl font-serif font-black text-[var(--ink)] mt-[-4px]">V</span>
        </div>
      </div>
      <h2 className="mt-8 text-xl md:text-2xl font-black text-[var(--ink)] tracking-widest animate-pulse uppercase">
        Đang nạp dữ liệu...
      </h2>
    </div>
  );
}
