"use client";

import { useEffect, useState } from "react";

const LOADING_PHRASES = [
  "Đang nhồi từ vựng vào não...",
  "Khởi động động cơ học thuật...",
  "Chờ xíu, kho từ vựng đang mở cửa...",
  "Hít một hơi thật sâu, chuẩn bị căng não...",
  "Từ vựng đang trên đường bay tới...",
  "Đang rèn giũa phản xạ IELTS...",
  "Cáp quang đang kéo từ vựng về..."
];

export default function Loading() {
  const [phrase, setPhrase] = useState("Đang chuẩn bị...");

  useEffect(() => {
    const randomPhrase = LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)];
    setPhrase(randomPhrase);
  }, []);

  return (
    <div className="fixed inset-0 bg-[var(--bg)] z-[100] flex flex-col items-center justify-center">
      <div className="relative w-24 h-24 md:w-32 md:h-32">
        <div className="absolute top-0 left-0 w-16 h-16 md:w-24 md:h-24 bg-[var(--blue)] border-[4px] border-[var(--ink)] rounded-xl animate-neo-swap-1"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 md:w-24 md:h-24 bg-[var(--yellow)] border-[4px] border-[var(--ink)] rounded-xl flex items-center justify-center animate-neo-swap-2">
          <span className="text-4xl md:text-6xl font-serif font-black text-[var(--ink)] mt-[-4px]">V</span>
        </div>
      </div>
      <h2 className="mt-8 text-lg md:text-2xl font-black text-[var(--ink)] tracking-widest animate-pulse uppercase text-center px-4 max-w-lg">
        {phrase}
      </h2>
    </div>
  );
}
