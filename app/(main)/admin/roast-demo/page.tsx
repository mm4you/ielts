'use client';

import { useState } from 'react';
import RoastButton from '@/components/RoastButton';
import PronounceRoast from '@/components/PronounceRoast';

export default function RoastDemoPage() {
  const [wordId, setWordId] = useState<number>(743); // Default ID to test
  const [wordText, setWordText] = useState('test_word');
  const [showRoast, setShowRoast] = useState(false);

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-black mb-6 uppercase border-b-4 border-black pb-2">
        🕵️‍♂️ Khu Vực Thử Nghiệm Mật (Admin Only)
      </h1>
      
      <p className="mb-6 text-lg font-bold text-gray-700">
        Test tính năng "AI Mỏ Hỗn" (Sassy Roasting Mode) có lồng tiếng.
      </p>

      <div className="panel bg-[#f0f0f0] mb-8 space-y-4">
        <div>
          <label className="block font-bold mb-2">Nhập ID của Từ vựng muốn test:</label>
          <input 
            type="number" 
            value={wordId}
            onChange={(e) => {
              setWordId(parseInt(e.target.value) || 0);
              setShowRoast(false);
            }}
            className="input-brutal w-full"
            placeholder="Ví dụ: 743"
          />
        </div>
        <div>
          <label className="block font-bold mb-2">Nhập chữ (để hiển thị):</label>
          <input 
            type="text" 
            value={wordText}
            onChange={(e) => {
              setWordText(e.target.value);
              setShowRoast(false);
            }}
            className="input-brutal w-full"
          />
        </div>

        <button 
          onClick={() => setShowRoast(true)}
          className="btn-brutal bg-black text-white px-6 py-2"
        >
          Load Nút Roast
        </button>
      </div>

      {showRoast && (
        <div className="space-y-8">
          <div className="border-4 border-black p-6 bg-white shadow-[8px_8px_0_rgba(0,0,0,1)]">
            <h2 className="text-2xl font-black mb-4">1. Nút chửi tự động:</h2>
            <RoastButton wordId={wordId} wordText={wordText} />
          </div>

          <div className="border-4 border-black p-6 bg-white shadow-[8px_8px_0_rgba(0,0,0,1)]">
            <h2 className="text-2xl font-black mb-4">2. Tính năng chấm điểm phát âm (Mới):</h2>
            <PronounceRoast wordId={wordId} wordText={wordText} />
          </div>
        </div>
      )}
    </div>
  );
}
