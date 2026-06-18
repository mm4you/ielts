'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Word, TOPICS, LEVELS, TOPIC_LABELS, POS_TYPES } from '@/types';
import { createWord, updateWord, deleteWord } from './actions';
import { parseMeaning } from '@/lib/parse';

interface UserData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  createdAt: Date;
  _count: {
    progress: number;
  }
}

export default function AdminClient({ initialWords, initialUsers }: { initialWords: Word[], initialUsers: UserData[] }) {
  const [activeTab, setActiveTab] = useState<'words' | 'users'>('words');
  const [words, setWords] = useState<Word[]>(initialWords);
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  
  // Word Filters & Pagination
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [wordPage, setWordPage] = useState(1);
  const wordsPerPage = 24;

  // User Filters & Pagination
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const usersPerPage = 24;

  // Modals & Edit Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [formData, setFormData] = useState({
    word: '',
    pos: '',
    ipa: '',
    meaning_vi: '',
    example: '',
    synonyms: '',
    topic: TOPICS[0] as string,
    level: LEVELS[0] as string,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset page numbers when filters change
  useEffect(() => {
    setWordPage(1);
  }, [search, selectedTopic, selectedLevel]);

  useEffect(() => {
    setUserPage(1);
  }, [userSearch]);

  // Word Filter & Pagination Logic
  const filteredWords = words.filter(w => {
    const matchesSearch = w.word.toLowerCase().includes(search.toLowerCase()) || 
      w.meaning_vi.toLowerCase().includes(search.toLowerCase());
    const matchesTopic = selectedTopic ? w.topic === selectedTopic : true;
    const matchesLevel = selectedLevel ? w.level === selectedLevel : true;
    return matchesSearch && matchesTopic && matchesLevel;
  });

  const totalWordPages = Math.ceil(filteredWords.length / wordsPerPage);
  const paginatedWords = filteredWords.slice((wordPage - 1) * wordsPerPage, wordPage * wordsPerPage);

  // User Filter & Pagination Logic
  const filteredUsers = users.filter(u => 
    (u.name?.toLowerCase().includes(userSearch.toLowerCase()) || false) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice((userPage - 1) * usersPerPage, userPage * usersPerPage);

  // Pagination helper
  const getPageNumbers = (currentPage: number, totalPages: number) => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      const start = Math.max(2, currentPage - 2);
      const end = Math.min(totalPages - 1, currentPage + 2);

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('...');
      }

      pages.push(totalPages);
    }
    return pages;
  };

  const handleOpenModal = (word?: Word) => {
    if (word) {
      setEditingWord(word);
      setFormData({
        word: word.word,
        pos: word.pos || '',
        ipa: word.ipa || '',
        meaning_vi: word.meaning_vi,
        example: word.example || '',
        synonyms: word.synonyms || '',
        topic: word.topic,
        level: word.level,
      });
    } else {
      setEditingWord(null);
      setFormData({
        word: '',
        pos: '',
        ipa: '',
        meaning_vi: '',
        example: '',
        synonyms: '',
        topic: TOPICS[0] as string,
        level: LEVELS[0] as string,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWord(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        word: formData.word.trim(),
        pos: formData.pos || undefined,
        ipa: formData.ipa.trim() || undefined,
        meaning_vi: formData.meaning_vi.trim(),
        example: formData.example.trim() || undefined,
        synonyms: formData.synonyms.trim() || undefined,
        topic: formData.topic,
        level: formData.level,
      };

      if (editingWord) {
        const updated = await updateWord(editingWord.id, payload);
        setWords(words.map(w => w.id === updated.id ? updated : w));
      } else {
        const created = await createWord(payload);
        setWords([created, ...words]);
      }
      handleCloseModal();
    } catch (err) {
      alert('Có lỗi xảy ra! Vui lòng thử lại.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa từ này không? Hành động này sẽ xóa luôn dữ liệu ôn tập của người dùng.')) {
      try {
        await deleteWord(id);
        setWords(words.filter(w => w.id !== id));
      } catch (err) {
        alert('Lỗi khi xóa!');
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Title & Top Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-black font-serif text-[var(--ink)] uppercase">Quản Trị Hệ Thống</h1>
          <p className="text-[var(--muted)] text-sm mt-1">Trang quản lý dành riêng cho quản trị viên.</p>
        </div>
        <div className="flex gap-3 flex-wrap justify-end">
          {activeTab === 'words' && (
            <>
              <Link 
                href="/admin/seed-bot" 
                className="btn-brutal bg-[var(--green)] text-white px-4 md:px-6 py-3 uppercase flex items-center justify-center text-sm md:text-base font-bold whitespace-nowrap"
              >
                Bơm Từ Mới Bằng Bot
              </Link>
              <Link 
                href="/admin/migrate" 
                className="btn-brutal bg-[var(--blue)] text-white px-4 md:px-6 py-3 uppercase flex items-center justify-center text-sm md:text-base font-bold whitespace-nowrap"
              >
                Cập nhật Loại từ AI
              </Link>
              <button 
                onClick={() => handleOpenModal()} 
                className="btn-brutal bg-[var(--yellow)] text-[var(--ink)] px-4 md:px-6 py-3 uppercase text-sm md:text-base whitespace-nowrap"
              >
                + Thêm Từ Mới
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b-4 border-[var(--line)]">
        <button 
          onClick={() => setActiveTab('words')}
          className={`px-6 py-3 font-bold text-lg uppercase transition-colors border-b-4 -mb-1 ${activeTab === 'words' ? 'border-[var(--blue)] text-[var(--blue)]' : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'}`}
        >
          Quản Lý Từ Vựng ({words.length})
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 font-bold text-lg uppercase transition-colors border-b-4 -mb-1 ${activeTab === 'users' ? 'border-[var(--blue)] text-[var(--blue)]' : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'}`}
        >
          Học Viên ({users.length})
        </button>
      </div>

      {/* WORD TAB CONTENT */}
      {activeTab === 'words' && (
        <>
          {/* Action buttons & filters */}
          <div className="panel mb-8 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Tìm kiếm từ hoặc nghĩa..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 px-4 py-3 border-[3px] border-[var(--line)] rounded-xl bg-[var(--paper)] focus:outline-none focus:shadow-[4px_4px_0_var(--line)] transition-shadow font-bold"
              />
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="px-4 py-3 border-[3px] border-[var(--line)] rounded-xl bg-[var(--paper)] focus:outline-none focus:shadow-[4px_4px_0_var(--line)] transition-shadow font-bold appearance-none cursor-pointer"
              >
                <option value="">Tất cả chủ đề</option>
                {TOPICS.map((topic) => (
                  <option key={topic} value={topic}>
                    {TOPIC_LABELS[topic] || topic}
                  </option>
                ))}
              </select>

              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-4 py-3 border-[3px] border-[var(--line)] rounded-xl bg-[var(--paper)] focus:outline-none focus:shadow-[4px_4px_0_var(--line)] transition-shadow font-bold appearance-none cursor-pointer"
              >
                <option value="">Tất cả mức</option>
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 flex-wrap pt-2 border-t border-dashed border-[var(--line)]">
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/seed-basic');
                    const data = await res.json();
                    alert(data.message);
                    if (data.success) window.location.reload();
                  } catch (e) {
                    alert('Lỗi nạp từ cơ bản');
                  }
                }}
                className="btn-brutal bg-[var(--yellow)] text-[var(--ink)] text-xs py-2 px-4 shadow-[2px_2px_0_var(--line)]"
              >
                + Nạp 50 từ cơ bản (A1)
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/improve-meanings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ limit: 50 })
                    });
                    const data = await res.json();
                    if (data.error) alert('Lỗi: ' + data.error);
                    else {
                      alert(data.message);
                      window.location.reload();
                    }
                  } catch (e) {
                    alert('Lỗi kết nối AI');
                  }
                }}
                className="btn-brutal bg-[#a855f7] text-white text-xs py-2 px-4 shadow-[2px_2px_0_var(--line)]"
              >
                ✨ AI Sửa Nghĩa Tự Động (50 từ)
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          {paginatedWords.length === 0 ? (
            <div className="panel text-center py-20">
              <p className="text-[var(--muted)] font-bold text-lg">Không tìm thấy từ vựng nào phù hợp!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedWords.map((word) => {
                  const { pos, en, vi } = parseMeaning(word.meaning_vi, word.pos);
                  return (
                    <div key={word.id} className="panel flex flex-col hover:-translate-y-1 transition-transform bg-[var(--paper)] h-full relative group">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--blue)] rounded-bl-full opacity-5"></div>
                      
                      <div className="flex items-start justify-between mb-2">
                        <div className="pr-6">
                          <div className="flex gap-2 items-center flex-wrap">
                            <h3 className="text-xl font-black font-serif text-[var(--ink)]">{word.word}</h3>
                            {pos && (
                              <span className="bg-gray-100 border border-[var(--line)] px-2 py-0.5 rounded-full text-[10px] font-bold dark:bg-gray-800">
                                {pos}
                              </span>
                            )}
                          </div>
                          {word.ipa && <p className="text-xs font-mono text-[var(--muted)] mt-0.5">{word.ipa}</p>}
                        </div>
                        <span className="text-[10px] font-mono text-gray-400 select-none">#{word.id}</span>
                      </div>

                      <div className="mt-2 flex-1 mb-4 space-y-2">
                        <p className="text-[var(--ink)] font-bold text-sm">
                          {en}
                        </p>
                        {vi && (
                          <p className="text-[var(--muted)] text-xs font-medium border-l-2 border-[var(--blue)] pl-2">
                            {vi}
                          </p>
                        )}
                        {word.synonyms && (
                          <p className="text-[11px] text-[var(--muted)] italic">
                            <span className="font-bold">Đồng nghĩa:</span> {word.synonyms}
                          </p>
                        )}
                        {word.example && (
                          <p className="text-[11px] text-[var(--muted)] line-clamp-2" title={word.example}>
                            <span className="font-bold text-[var(--ink)]">Ví dụ:</span> {word.example}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        <span className="chip bg-[var(--yellow)] text-black text-[10px] py-0.5 px-2">{word.level}</span>
                        <span className="chip text-[10px] py-0.5 px-2">{TOPIC_LABELS[word.topic] || word.topic}</span>
                      </div>

                      <div className="flex items-center gap-2 mt-auto pt-4 border-t-2 border-dashed border-[var(--line)]">
                        <Link href={`/word/${word.id}`} className="btn-brutal bg-[var(--paper)] text-[var(--ink)] text-[11px] px-2.5 py-1.5 font-bold flex-1 text-center select-none shadow-[2px_2px_0_var(--line)]">
                          Xem
                        </Link>
                        <button onClick={() => handleOpenModal(word)} className="btn-brutal bg-[var(--blue)] text-white text-[11px] px-2.5 py-1.5 font-bold flex-1 shadow-[2px_2px_0_var(--line)]">
                          Sửa
                        </button>
                        <button onClick={() => handleDelete(word.id)} className="btn-brutal bg-[var(--red)] text-white text-[11px] px-2.5 py-1.5 font-bold shadow-[2px_2px_0_var(--line)]">
                          Xóa
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalWordPages > 1 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mt-12 bg-[var(--paper)] p-5 border-[3px] border-[var(--line)] shadow-[6px_6px_0_var(--line)] rounded-2xl w-full">
                  <p className="text-sm font-bold text-[var(--muted)]">
                    Hiển thị từ <span className="text-[var(--ink)] font-black">{(wordPage - 1) * wordsPerPage + 1}</span> - <span className="text-[var(--ink)] font-black">{Math.min(wordPage * wordsPerPage, filteredWords.length)}</span> trên <span className="text-[var(--ink)] font-black">{filteredWords.length}</span> từ vựng
                  </p>

                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    <button
                      disabled={wordPage === 1}
                      onClick={() => {
                        setWordPage((prev) => Math.max(prev - 1, 1));
                      }}
                      className="w-10 h-10 flex items-center justify-center border-2 border-[var(--line)] rounded-lg font-bold bg-[var(--bg)] text-[var(--ink)] shadow-[2px_2px_0_var(--line)] disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--line)] active:translate-y-0.5 active:shadow-[1px_1px_0_var(--line)] transition-all cursor-pointer"
                    >
                      &lt;
                    </button>

                    {getPageNumbers(wordPage, totalWordPages).map((p, idx) => {
                      if (p === '...') {
                        return (
                          <span key={`dots-${idx}`} className="w-10 h-10 flex items-center justify-center font-bold text-[var(--muted)]">
                            ...
                          </span>
                        );
                      }

                      const isCurrent = p === wordPage;
                      return (
                        <button
                          key={`page-${p}`}
                          onClick={() => {
                            setWordPage(p as number);
                          }}
                          className={`w-10 h-10 flex items-center justify-center border-2 border-[var(--line)] rounded-lg font-bold transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-[var(--green)] text-white shadow-[2px_2px_0_var(--line)]'
                              : 'bg-[var(--bg)] text-[var(--ink)] shadow-[2px_2px_0_var(--line)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--line)] active:translate-y-0.5 active:shadow-[1px_1px_0_var(--line)] hover:bg-[var(--green)]/10'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}

                    <button
                      disabled={wordPage === totalWordPages}
                      onClick={() => {
                        setWordPage((prev) => Math.min(prev + 1, totalWordPages));
                      }}
                      className="w-10 h-10 flex items-center justify-center border-2 border-[var(--line)] rounded-lg font-bold bg-[var(--bg)] text-[var(--ink)] shadow-[2px_2px_0_var(--line)] disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--line)] active:translate-y-0.5 active:shadow-[1px_1px_0_var(--line)] transition-all cursor-pointer"
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* USERS TAB CONTENT */}
      {activeTab === 'users' && (
        <>
          {/* User filters */}
          <div className="panel mb-8">
            <input
              type="text"
              placeholder="Tìm kiếm học viên theo tên hoặc email..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="w-full px-4 py-3 border-[3px] border-[var(--line)] rounded-xl bg-[var(--paper)] focus:outline-none focus:shadow-[4px_4px_0_var(--line)] transition-shadow font-bold"
            />
          </div>

          {/* Cards Grid */}
          {paginatedUsers.length === 0 ? (
            <div className="panel text-center py-20">
              <p className="text-[var(--muted)] font-bold text-lg">Không tìm thấy học viên nào phù hợp!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedUsers.map((user) => {
                  const isAdmin = user.email === 'ungnhutkhang53@gmail.com' || user.role === 'admin';
                  return (
                    <div key={user.id} className="panel flex flex-col hover:-translate-y-1 transition-transform bg-[var(--paper)] h-full relative group">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--yellow)] rounded-bl-full opacity-5"></div>
                      
                      <div className="flex items-center gap-3 mb-4">
                        <span className="w-12 h-12 rounded-full bg-[var(--yellow)] border-[3px] border-[var(--line)] flex items-center justify-center font-black text-[var(--ink)] text-lg shadow-[2px_2px_0_var(--line)] select-none">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-black text-md text-[var(--ink)] truncate" title={user.name || 'Người dùng ẩn danh'}>
                              {user.name || 'Người dùng ẩn danh'}
                            </h3>
                            {isAdmin ? (
                              <span className="bg-[var(--yellow)] text-[var(--ink)] text-[9px] px-2 py-0.5 rounded-full font-bold border border-[var(--line)] select-none">
                                ADMIN
                              </span>
                            ) : (
                              <span className="bg-gray-100 border border-[var(--line)] text-[9px] px-2 py-0.5 rounded-full font-bold dark:bg-gray-800 text-[var(--muted)] select-none">
                                Học viên
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--muted)] font-mono truncate" title={user.email}>{user.email}</p>
                        </div>
                      </div>

                      <div className="flex-1 space-y-3 mb-4">
                        <div className="flex justify-between items-center bg-[var(--bg)] p-2.5 border-2 border-[var(--line)] rounded-xl shadow-[2px_2px_0_var(--line)]">
                          <span className="text-xs font-bold text-[var(--muted)]">Từ đang học:</span>
                          <span className="font-black text-[var(--blue)] text-lg">{user._count.progress} từ</span>
                        </div>
                        
                        <div className="text-[11px] text-[var(--muted)] font-medium">
                          Tham gia: {new Date(user.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      </div>

                      {user.email !== 'ungnhutkhang53@gmail.com' && (
                        <div className="mt-auto pt-4 border-t-2 border-dashed border-[var(--line)] flex gap-2">
                          <button 
                            onClick={async () => {
                              const newRole = user.role === 'admin' ? 'user' : 'admin';
                              const confirmMsg = newRole === 'admin' 
                                ? `Bạn có chắc muốn cấp quyền ADMIN cho học viên ${user.name || user.email}?` 
                                : `Bạn có chắc muốn hạ quyền quản trị của ${user.name || user.email} xuống học viên thường không?`;
                              if (confirm(confirmMsg)) {
                                try {
                                  const res = await fetch(`/api/users/${user.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ role: newRole })
                                  });
                                  if (res.ok) {
                                    alert('Cập nhật vai trò thành công!');
                                    window.location.reload();
                                  } else {
                                    const data = await res.json();
                                    alert(data.error || 'Cập nhật thất bại.');
                                  }
                                } catch (e) {
                                  alert('Có lỗi xảy ra.');
                                }
                              }
                            }}
                            className="btn-brutal bg-[var(--yellow)] text-[var(--ink)] text-[10px] py-1.5 px-2 font-bold flex-1 shadow-[2px_2px_0_var(--line)] cursor-pointer"
                          >
                            {user.role === 'admin' ? 'Hạ quyền' : 'Lên Admin'}
                          </button>
                          <button 
                            onClick={async () => {
                              const newPass = prompt(`Nhập mật khẩu mới cho ${user.name || user.email}:`, "123456");
                              if (newPass) {
                                if (newPass.length < 6) {
                                  alert('Mật khẩu phải chứa ít nhất 6 ký tự.');
                                  return;
                                }
                                try {
                                  const res = await fetch(`/api/users/${user.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ password: newPass })
                                  });
                                  if (res.ok) {
                                    alert('Đặt lại mật khẩu thành công!');
                                  } else {
                                    const data = await res.json();
                                    alert(data.error || 'Lỗi khi đặt lại mật khẩu.');
                                  }
                                } catch (e) {
                                  alert('Có lỗi xảy ra.');
                                }
                              }
                            }}
                            className="btn-brutal bg-[var(--blue)] text-white text-[10px] py-1.5 px-2 font-bold flex-1 shadow-[2px_2px_0_var(--line)] cursor-pointer"
                          >
                            Đổi Pass
                          </button>
                          <button 
                            onClick={async () => {
                              if (confirm(`Bạn có chắc muốn xóa học viên ${user.name || user.email}? Hành động này không thể hoàn tác!`)) {
                                try {
                                  const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
                                  if (res.ok) {
                                    window.location.reload();
                                  } else {
                                    alert('Không thể xóa người dùng này.');
                                  }
                                } catch (e) {
                                  alert('Có lỗi xảy ra.');
                                }
                              }
                            }}
                            className="btn-brutal bg-[var(--red)] text-white text-[10px] py-1.5 px-2 font-bold shadow-[2px_2px_0_var(--line)] cursor-pointer"
                          >
                            Xóa
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* User Pagination */}
              {totalUserPages > 1 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mt-12 bg-[var(--paper)] p-5 border-[3px] border-[var(--line)] shadow-[6px_6px_0_var(--line)] rounded-2xl w-full">
                  <p className="text-sm font-bold text-[var(--muted)]">
                    Hiển thị học viên <span className="text-[var(--ink)] font-black">{(userPage - 1) * usersPerPage + 1}</span> - <span className="text-[var(--ink)] font-black">{Math.min(userPage * usersPerPage, filteredUsers.length)}</span> trên <span className="text-[var(--ink)] font-black">{filteredUsers.length}</span> học viên
                  </p>

                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    <button
                      disabled={userPage === 1}
                      onClick={() => {
                        setUserPage((prev) => Math.max(prev - 1, 1));
                      }}
                      className="w-10 h-10 flex items-center justify-center border-2 border-[var(--line)] rounded-lg font-bold bg-[var(--bg)] text-[var(--ink)] shadow-[2px_2px_0_var(--line)] disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--line)] active:translate-y-0.5 active:shadow-[1px_1px_0_var(--line)] transition-all cursor-pointer"
                    >
                      &lt;
                    </button>

                    {getPageNumbers(userPage, totalUserPages).map((p, idx) => {
                      if (p === '...') {
                        return (
                          <span key={`dots-${idx}`} className="w-10 h-10 flex items-center justify-center font-bold text-[var(--muted)]">
                            ...
                          </span>
                        );
                      }

                      const isCurrent = p === userPage;
                      return (
                        <button
                          key={`page-${p}`}
                          onClick={() => {
                            setUserPage(p as number);
                          }}
                          className={`w-10 h-10 flex items-center justify-center border-2 border-[var(--line)] rounded-lg font-bold transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-[var(--green)] text-white shadow-[2px_2px_0_var(--line)]'
                              : 'bg-[var(--bg)] text-[var(--ink)] shadow-[2px_2px_0_var(--line)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--line)] active:translate-y-0.5 active:shadow-[1px_1px_0_var(--line)] hover:bg-[var(--green)]/10'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}

                    <button
                      disabled={userPage === totalUserPages}
                      onClick={() => {
                        setUserPage((prev) => Math.min(prev + 1, totalUserPages));
                      }}
                      className="w-10 h-10 flex items-center justify-center border-2 border-[var(--line)] rounded-lg font-bold bg-[var(--bg)] text-[var(--ink)] shadow-[2px_2px_0_var(--line)] disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--line)] active:translate-y-0.5 active:shadow-[1px_1px_0_var(--line)] transition-all cursor-pointer"
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[var(--bg)]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="panel max-w-2xl w-full bg-[var(--paper)] my-8">
            <h2 className="text-2xl font-black mb-6 uppercase">{editingWord ? 'Sửa Từ Vựng' : 'Thêm Từ Mới'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Từ vựng (Tiếng Anh)</label>
                  <input required value={formData.word} onChange={e => setFormData({...formData, word: e.target.value})} className="w-full px-3 py-2 border-[2px] border-[var(--line)] rounded-lg font-bold bg-[var(--paper)] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Loại từ</label>
                  <select value={formData.pos} onChange={e => setFormData({...formData, pos: e.target.value})} className="w-full px-3 py-2 border-[2px] border-[var(--line)] rounded-lg font-bold bg-[var(--paper)] cursor-pointer">
                    <option value="">Không phân loại</option>
                    {POS_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Phiên âm (IPA) - Tùy chọn</label>
                  <input value={formData.ipa} onChange={e => setFormData({...formData, ipa: e.target.value})} className="w-full px-3 py-2 border-[2px] border-[var(--line)] rounded-lg font-mono bg-[var(--paper)] focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Nghĩa (Định dạng: Nghĩa tiếng Anh ||| Nghĩa tiếng Việt)</label>
                <textarea required rows={3} value={formData.meaning_vi} onChange={e => setFormData({...formData, meaning_vi: e.target.value})} className="w-full px-3 py-2 border-[2px] border-[var(--line)] rounded-lg font-bold bg-[var(--paper)] focus:outline-none" placeholder="to be extremely happy ||| Vô cùng hạnh phúc"></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Ví dụ (Tùy chọn)</label>
                <textarea rows={2} value={formData.example} onChange={e => setFormData({...formData, example: e.target.value})} className="w-full px-3 py-2 border-[2px] border-[var(--line)] rounded-lg bg-[var(--paper)] focus:outline-none"></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Từ đồng nghĩa (Tùy chọn - Phân cách bằng dấu phẩy)</label>
                <input value={formData.synonyms} onChange={e => setFormData({...formData, synonyms: e.target.value})} className="w-full px-3 py-2 border-[2px] border-[var(--line)] rounded-lg bg-[var(--paper)] focus:outline-none" placeholder="happy, joyful" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Chủ đề</label>
                  <select value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} className="w-full px-3 py-2 border-[2px] border-[var(--line)] rounded-lg font-bold bg-[var(--paper)] cursor-pointer">
                    {TOPICS.map(t => <option key={t} value={t}>{TOPIC_LABELS[t] || t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Mức độ</label>
                  <select value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})} className="w-full px-3 py-2 border-[2px] border-[var(--line)] rounded-lg font-bold bg-[var(--paper)] cursor-pointer">
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4 mt-4 border-t-2 border-dashed border-[var(--line)]">
                <button type="submit" disabled={isSubmitting} className="btn-brutal bg-[var(--green)] text-white flex-1 py-3 uppercase shadow-[2px_2px_0_var(--line)]">
                  {isSubmitting ? 'Đang lưu...' : 'Lưu lại'}
                </button>
                <button type="button" onClick={handleCloseModal} className="btn-brutal bg-[var(--paper)] text-[var(--ink)] px-6 py-3 uppercase shadow-[2px_2px_0_var(--line)]">
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
