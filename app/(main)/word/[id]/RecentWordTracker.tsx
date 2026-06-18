'use client';

import { useEffect } from 'react';
import { Word } from '@/types';

export default function RecentWordTracker({ word }: { word: Word }) {
  useEffect(() => {
    try {
      const historyStr = localStorage.getItem('recent_words');
      const history = historyStr ? JSON.parse(historyStr) : [];
      
      const newEntry = { id: word.id, word: word.word, meaning_vi: word.meaning_vi };
      
      // Remove if it already exists to put it at the front
      const filtered = history.filter((w: any) => w.id !== word.id);
      filtered.unshift(newEntry);
      
      // Keep only last 20 recent words
      localStorage.setItem('recent_words', JSON.stringify(filtered.slice(0, 20)));
    } catch (e) {
      console.error('Failed to save recent word', e);
    }
  }, [word.id, word.word, word.meaning_vi]);

  return null; // This component doesn't render anything
}
