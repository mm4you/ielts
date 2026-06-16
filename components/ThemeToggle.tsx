'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  // On mount, read from localStorage or system preference
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved) {
      setDark(saved === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDark(prefersDark);
    }
  }, []);

  // Apply class to html element
  useEffect(() => {
    const html = document.documentElement;
    if (dark) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <button
      aria-label="Toggle dark mode"
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      onClick={() => setDark(!dark)}
    >
      {dark ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-yellow-400">
          <path d="M12 3a9 9 0 0 0 0 18 9 9 0 0 0 0-18z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-600">
          <path d="M21 12.79A9 9 0 0 1 12.21 3c-.13 0-.26 0-.39.01A7 7 0 0 0 12 21a9 9 0 0 0 9-8.21z" />
        </svg>
      )}
    </button>
  );
}
