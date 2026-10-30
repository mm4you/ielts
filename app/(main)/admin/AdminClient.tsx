'use client';
import ChoiceSelect from '@/components/ChoiceSelect';
import PageHeader from '@/components/PageHeader';


import { Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, Button, Input, Field, Textarea } from '@fluentui/react-components';
import { DismissRegular } from '@fluentui/react-icons/svg/dismiss';
import { useConfirmation } from '@/components/ConfirmationProvider';
import { showToast } from '@/components/GlobalToast';
import { WandRegular } from '@fluentui/react-icons/svg/wand';
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
  const { confirm, password: requestPassword } = useConfirmation();
  const [aiDrafts,setAiDrafts] = useState<{wordId:number;word:string;before:string;after:string}[]>([]);
  const [activeTab, setActiveTab] = useState<'words' | 'users'>('words');
  const [words, setWords] = useState<Word[]>(initialWords);
  const [users, setUsers] = useState<UserData[]>(initialUsers);

  const showMessage = (message: string) => showToast(message, false);

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
      showMessage('Có lỗi xảy ra! Vui lòng thử lại.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (await confirm({title:'Xóa từ vựng',description:'Thao tác này cũng xóa dữ liệu ôn tập của từ này. Hành động không thể hoàn tác.',confirmLabel:'Xóa từ',danger:true})) {
      try {
        await deleteWord(id);
        setWords(words.filter(w => w.id !== id));
      } catch (err) {
        showMessage('Lỗi khi xóa!');
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Quản trị" actions={<div className="flex gap-3 flex-wrap justify-end">
          {activeTab === 'words' && (
            <>
              <Link
                href="/admin/seed-bot"
                className=" bg-[var(--green)] text-white px-4 md:px-6 py-3 flex items-center justify-center text-sm md:text-base font-semibold whitespace-nowrap"
              >
                Tạo từ bằng AI
              </Link>
              <Link
                href="/admin/migrate"
                className=" bg-[var(--blue)] text-white px-4 md:px-6 py-3 flex items-center justify-center text-sm md:text-base font-semibold whitespace-nowrap"
              >
                Cập nhật loại từ
              </Link>
              <Button
                onClick={() => handleOpenModal()}
                className=" bg-[var(--brand-soft)] text-[var(--blue)] px-4 md:px-6 py-3 text-sm md:text-base whitespace-nowrap"
              >
                Thêm từ
              </Button>
            </>
          )}
        </div>} />

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-[var(--line)]">
        <Button
          onClick={() => setActiveTab('words')}
          className={`px-4 py-3 font-semibold text-sm transition-colors border-b -mb-1 ${activeTab === 'words' ? 'border-[var(--blue)] text-[var(--blue)]' : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'}`}
        >
          Từ vựng ({words.length})
        </Button>
        <Button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-3 font-semibold text-sm transition-colors border-b -mb-1 ${activeTab === 'users' ? 'border-[var(--blue)] text-[var(--blue)]' : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'}`}
        >
          Người dùng ({users.length})
        </Button>
      </div>

      {/* WORD TAB CONTENT */}
      {activeTab === 'words' && (
        <>
          {/* Action buttons & filters */}
          <div className="panel mb-8 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                type="text"
                placeholder="Tìm kiếm từ hoặc nghĩa..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 px-4 py-3 border border-[var(--line)] rounded-xl bg-[var(--paper)] focus:outline-none transition-shadow font-semibold"
              />
              <ChoiceSelect
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="px-4 py-3 border border-[var(--line)] rounded-xl bg-[var(--paper)] focus:outline-none transition-shadow font-semibold appearance-none cursor-pointer"
              >
                <option value="">Tất cả chủ đề</option>
                {TOPICS.map((topic) => (
                  <option key={topic} value={topic}>
                    {TOPIC_LABELS[topic] || topic}
                  </option>
                ))}
              </ChoiceSelect>

              <ChoiceSelect
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-4 py-3 border border-[var(--line)] rounded-xl bg-[var(--paper)] focus:outline-none transition-shadow font-semibold appearance-none cursor-pointer"
              >
                <option value="">Tất cả mức</option>
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </ChoiceSelect>
            </div>

            <div className="flex gap-3 flex-wrap pt-2 border-t border-solid border-[var(--line)]">
              <Button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/seed-basic');
                    const data = await res.json();
                    showToast(data.message, true);
                    if (data.success) window.location.reload();
                  } catch (e) {
                    showMessage('Lỗi nạp từ cơ bản');
                  }
                }}
                className=" bg-[var(--brand-soft)] text-[var(--blue)] text-xs py-2 px-4 "
              >
                + Nạp 50 từ cơ bản (A1)
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/improve-meanings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ limit: 10 })
                    });
                    const data = await res.json();
                    if (data.error) showMessage('Lỗi: ' + data.error);
                    else {
                      showToast(data.message, true);
                      setAiDrafts(data.drafts || []);
                    }
                  } catch (e) {
                    showMessage('Lỗi kết nối AI');
                  }
                }}
                className=" bg-[var(--blue)] text-white text-xs py-2 px-4 flex items-center justify-center gap-1.5"
              >
                <WandRegular aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
                <span>Tạo bản nháp nghĩa (10 từ)</span>
              </Button>
            </div>
          </div>

          {/* Cards Grid */}
          {paginatedWords.length === 0 ? (
            <div className="panel text-center py-20">
              <p className="text-[var(--muted)] font-semibold text-lg">Không tìm thấy từ vựng nào phù hợp!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedWords.map((word) => {
                  const { pos, en, vi } = parseMeaning(word.meaning_vi, word.pos);
                  return (
                    <div key={word.id} className="panel flex flex-col transition-transform bg-[var(--paper)] h-full relative group">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--blue)] rounded-bl-full opacity-5"></div>

                      <div className="flex items-start justify-between mb-2">
                        <div className="pr-6">
                          <div className="flex gap-2 items-center flex-wrap">
                            <h3 className="text-xl font-semibold font-sans text-[var(--ink)]">{word.word}</h3>
                            {pos && (
                              <span className="bg-[var(--bg)] text-[var(--muted)] border border-[var(--line)] px-2 py-0.5 rounded-md text-[10px] font-semibold select-none ">
                                {pos}
                              </span>
                            )}
                          </div>
                          {word.ipa && <p className="text-xs font-sans text-[var(--muted)] mt-0.5">{word.ipa}</p>}
                        </div>
                        <span className="text-[10px] font-sans text-gray-400 select-none">#{word.id}</span>
                      </div>

                      <div className="mt-2 flex-1 mb-4 space-y-2">
                        <p className="text-[var(--ink)] font-semibold text-sm">
                          {en}
                        </p>
                        {vi && (
                          <p className="text-[var(--muted)] text-xs font-medium border-l border-[var(--blue)] pl-2">
                            {vi}
                          </p>
                        )}
                        {word.synonyms && (
                          <p className="text-[11px] text-[var(--muted)] italic">
                            <span className="font-semibold">Đồng nghĩa:</span> {word.synonyms}
                          </p>
                        )}
                        {word.example && (
                          <p className="text-[11px] text-[var(--muted)] line-clamp-2" title={word.example}>
                            <span className="font-semibold text-[var(--ink)]">Ví dụ:</span> {word.example}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        <span className="bg-[var(--brand-soft)] text-[var(--blue)] border border-[var(--line)] font-semibold text-[10px] py-0.5 px-2 rounded-md ">{word.level}</span>
                        <span className="chip text-[10px] py-0.5 px-2">{TOPIC_LABELS[word.topic] || word.topic}</span>
                      </div>

                      <div className="flex items-center gap-2 mt-auto pt-4 border-t border-solid border-[var(--line)]">
                        <Link href={`/word/${word.id}`} className=" bg-[var(--paper)] text-[var(--ink)] text-[11px] px-2.5 py-1.5 font-semibold flex-1 text-center select-none ">
                          Xem
                        </Link>
                        <Button onClick={() => handleOpenModal(word)} className=" bg-[var(--blue)] text-white text-[11px] px-2.5 py-1.5 font-semibold flex-1 ">
                          Sửa
                        </Button>
                        <Button onClick={() => handleDelete(word.id)} className=" bg-[var(--red)] text-white text-[11px] px-2.5 py-1.5 font-semibold ">
                          Xóa
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalWordPages > 1 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mt-12 bg-[var(--paper)] p-5 border border-[var(--line)] rounded-2xl w-full">
                  <p className="text-sm font-semibold text-[var(--muted)]">
                    Hiển thị từ <span className="text-[var(--ink)] font-semibold">{(wordPage - 1) * wordsPerPage + 1}</span> - <span className="text-[var(--ink)] font-semibold">{Math.min(wordPage * wordsPerPage, filteredWords.length)}</span> trên <span className="text-[var(--ink)] font-semibold">{filteredWords.length}</span> từ vựng
                  </p>

                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    <Button
                      disabled={wordPage === 1}
                      onClick={() => {
                        setWordPage((prev) => Math.max(prev - 1, 1));
                      }}
                      className="w-10 h-10 flex items-center justify-center border border-[var(--line)] rounded-lg font-semibold bg-[var(--bg)] text-[var(--ink)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      &lt;
                    </Button>

                    {getPageNumbers(wordPage, totalWordPages).map((p, idx) => {
                      if (p === '...') {
                        return (
                          <span key={`dots-${idx}`} className="w-10 h-10 flex items-center justify-center font-semibold text-[var(--muted)]">
                            ...
                          </span>
                        );
                      }

                      const isCurrent = p === wordPage;
                      return (
                        <Button
                          key={`page-${p}`}
                          onClick={() => {
                            setWordPage(p as number);
                          }}
                          className={`w-10 h-10 flex items-center justify-center border border-[var(--line)] rounded-lg font-semibold transition-all cursor-pointer ${ isCurrent ? 'bg-[var(--green)] text-white ' : 'bg-[var(--bg)] text-[var(--ink)] hover:bg-[var(--green)]/10' }`}
                        >
                          {p}
                        </Button>
                      );
                    })}

                    <Button
                      disabled={wordPage === totalWordPages}
                      onClick={() => {
                        setWordPage((prev) => Math.min(prev + 1, totalWordPages));
                      }}
                      className="w-10 h-10 flex items-center justify-center border border-[var(--line)] rounded-lg font-semibold bg-[var(--bg)] text-[var(--ink)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      &gt;
                    </Button>
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
            <Input
              type="text"
              placeholder="Tìm kiếm học viên theo tên hoặc email..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="w-full px-4 py-3 border border-[var(--line)] rounded-xl bg-[var(--paper)] focus:outline-none transition-shadow font-semibold"
            />
          </div>

          {/* Users Table */}
          {paginatedUsers.length === 0 ? (
            <div className="panel text-center py-20">
              <p className="text-[var(--muted)] font-semibold text-lg">Không tìm thấy học viên nào phù hợp!</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto border border-[var(--line)] rounded-2xl bg-[var(--paper)]">
                <table className="w-full text-left border-collapse min-w-[650px] md:min-w-0">
                  <thead>
                    <tr className="border-b-[3px] border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] select-none">
                      <th className="p-4 font-semibold text-sm ">Người dùng</th>
                      <th className="p-4 font-semibold text-sm w-[120px]">Vai trò</th>
                      <th className="p-4 font-semibold text-sm w-[140px]">Từ đang học</th>
                      <th className="p-4 font-semibold text-sm hidden md:table-cell w-[160px]">Ngày tham gia</th>
                      <th className="p-4 font-semibold text-sm text-right w-[180px]">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user) => {
                      const isAdmin = user.email === 'ungnhutkhang53@gmail.com' || user.role === 'admin';
                      return (
                        <tr key={user.id} className="border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--bg)]/10 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <span className="w-10 h-10 rounded-full bg-[var(--bg)] border border-[var(--line)] flex items-center justify-center font-semibold text-[var(--ink)] text-sm select-none shrink-0">
                                {user.name?.charAt(0).toUpperCase() || 'U'}
                              </span>
                              <div className="min-w-0">
                                <span className="font-semibold text-[var(--ink)] truncate block" title={user.name || 'Người dùng ẩn danh'}>
                                  {user.name || 'Người dùng ẩn danh'}
                                </span>
                                <span className="text-xs text-[var(--muted)] font-sans block truncate" title={user.email}>{user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            {isAdmin ? (
                              <span className="bg-[var(--brand-soft)] text-[var(--blue)] text-[10px] px-2 py-0.5 rounded-md font-semibold border border-[var(--line)] select-none">
                                ADMIN
                              </span>
                            ) : (
                              <span className="bg-[var(--blue)] text-white text-[10px] px-2 py-0.5 rounded-md font-semibold border border-[var(--line)] select-none">
                                Học viên
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-[var(--ink)] text-sm">
                              {user._count.progress} từ
                            </span>
                          </td>
                          <td className="p-4 text-xs font-sans text-[var(--muted)] hidden md:table-cell">
                            {new Date(user.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'numeric', day: 'numeric' })}
                          </td>
                          <td className="p-4 text-right">
                            {user.email !== 'ungnhutkhang53@gmail.com' ? (
                              <div className="flex justify-end gap-2">
                                <Button
                                  onClick={async () => {
                                    const newPass = await requestPassword({title:'Đặt lại mật khẩu',description:`Nhập mật khẩu mới cho ${user.name || user.email}.`,confirmLabel:'Đặt lại mật khẩu'});
                                    if (newPass) {
                                      if (newPass.length < 6) {
                                        showMessage('Mật khẩu phải chứa ít nhất 6 ký tự.');
                                        return;
                                      }
                                      try {
                                        const res = await fetch(`/api/users/${user.id}`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ password: newPass })
                                        });
                                        if (res.ok) {
                                          showToast('Đã đặt lại mật khẩu', true);
                                        } else {
                                          const data = await res.json();
                                          showMessage(data.error || 'Lỗi khi đặt lại mật khẩu.');
                                        }
                                      } catch (e) {
                                        showMessage('Có lỗi xảy ra.');
                                      }
                                    }
                                  }}
                                  className=" bg-[var(--blue)] text-white text-[10px] py-1 px-2.5 font-semibold cursor-pointer transition-all shrink-0"
                                >
                                  Đổi mật khẩu
                                </Button>
                                <Button
                                  onClick={async () => {
                                    if (await confirm({title:'Xóa người dùng',description:`Xóa tài khoản ${user.name || user.email}? Hành động này không thể hoàn tác.`,confirmLabel:'Xóa người dùng',danger:true})) {
                                      try {
                                        const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
                                        if (res.ok) {
                                          window.location.reload();
                                        } else {
                                          showMessage('Không thể xóa người dùng này.');
                                        }
                                      } catch (e) {
                                        showMessage('Có lỗi xảy ra.');
                                      }
                                    }
                                  }}
                                  className=" bg-[var(--red)] text-white text-[10px] py-1 px-2.5 font-semibold cursor-pointer transition-all shrink-0"
                                >
                                  Xóa
                                </Button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-[var(--muted)] font-semibold italic">Bảo vệ</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

{/* User Pagination */}
              {totalUserPages > 1 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mt-12 bg-[var(--paper)] p-5 border border-[var(--line)] rounded-2xl w-full">
                  <p className="text-sm font-semibold text-[var(--muted)]">
                    Hiển thị học viên <span className="text-[var(--ink)] font-semibold">{(userPage - 1) * usersPerPage + 1}</span> - <span className="text-[var(--ink)] font-semibold">{Math.min(userPage * usersPerPage, filteredUsers.length)}</span> trên <span className="text-[var(--ink)] font-semibold">{filteredUsers.length}</span> học viên
                  </p>

                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    <Button
                      disabled={userPage === 1}
                      onClick={() => {
                        setUserPage((prev) => Math.max(prev - 1, 1));
                      }}
                      className="w-10 h-10 flex items-center justify-center border border-[var(--line)] rounded-lg font-semibold bg-[var(--bg)] text-[var(--ink)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      &lt;
                    </Button>

                    {getPageNumbers(userPage, totalUserPages).map((p, idx) => {
                      if (p === '...') {
                        return (
                          <span key={`dots-${idx}`} className="w-10 h-10 flex items-center justify-center font-semibold text-[var(--muted)]">
                            ...
                          </span>
                        );
                      }

                      const isCurrent = p === userPage;
                      return (
                        <Button
                          key={`page-${p}`}
                          onClick={() => {
                            setUserPage(p as number);
                          }}
                          className={`w-10 h-10 flex items-center justify-center border border-[var(--line)] rounded-lg font-semibold transition-all cursor-pointer ${ isCurrent ? 'bg-[var(--green)] text-white ' : 'bg-[var(--bg)] text-[var(--ink)] hover:bg-[var(--green)]/10' }`}
                        >
                          {p}
                        </Button>
                      );
                    })}

                    <Button
                      disabled={userPage === totalUserPages}
                      onClick={() => {
                        setUserPage((prev) => Math.min(prev + 1, totalUserPages));
                      }}
                      className="w-10 h-10 flex items-center justify-center border border-[var(--line)] rounded-lg font-semibold bg-[var(--bg)] text-[var(--ink)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      &gt;
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      <Dialog open={aiDrafts.length>0} onOpenChange={(_,d)=>{if(!d.open)setAiDrafts([]);}}><DialogSurface><DialogBody><DialogTitle action={<Button onClick={()=>setAiDrafts([])}>Đóng</Button>}>Bản nháp cần duyệt</DialogTitle><DialogContent><p>Nội dung chưa được lưu. Đối chiếu nguồn rồi sửa từng từ trong thư viện.</p>{aiDrafts.map(d=><article key={d.wordId}><h3>{d.word}</h3><p>Hiện tại: {d.before}</p><p>Đề xuất: {d.after}</p></article>)}</DialogContent></DialogBody></DialogSurface></Dialog>
      <Dialog open={isModalOpen} onOpenChange={(_,data)=>{if(!data.open&&!isSubmitting)handleCloseModal();}}><DialogSurface className="admin-word-dialog"><DialogBody><DialogTitle action={<Button appearance="subtle" aria-label="Đóng" disabled={isSubmitting} onClick={handleCloseModal} icon={<DismissRegular />} />}>{editingWord?'Sửa từ vựng':'Thêm từ vựng'}</DialogTitle><DialogContent>            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Từ vựng (Tiếng Anh)">

                  <Input aria-label="Từ vựng (Tiếng Anh)" required value={formData.word} onChange={e => setFormData({...formData, word: e.target.value})} className="w-full px-3 py-2 border border-[var(--line)] rounded-lg font-semibold bg-[var(--paper)] focus:outline-none" />
                </Field>
                <Field label="Loại từ">

                  <ChoiceSelect aria-label="Loại từ" value={formData.pos} onChange={e => setFormData({...formData, pos: e.target.value})} className="w-full px-3 py-2 border border-[var(--line)] rounded-lg font-semibold bg-[var(--paper)] cursor-pointer">
                    <option value="">Không phân loại</option>
                    {POS_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                  </ChoiceSelect>
                </Field>
                <Field label="Phiên âm (IPA) - Tùy chọn">

                  <Input aria-label="Phiên âm (IPA) - Tùy chọn" value={formData.ipa} onChange={e => setFormData({...formData, ipa: e.target.value})} className="w-full px-3 py-2 border border-[var(--line)] rounded-lg font-sans bg-[var(--paper)] focus:outline-none" />
                </Field>
              </div>

              <Field label="Nghĩa (Định dạng: Nghĩa tiếng Anh ||| Nghĩa tiếng Việt)">

                <Textarea required rows={3} value={formData.meaning_vi} onChange={e => setFormData({...formData, meaning_vi: e.target.value})} className="w-full px-3 py-2 border border-[var(--line)] rounded-lg font-semibold bg-[var(--paper)] focus:outline-none" placeholder="to be extremely happy ||| Vô cùng hạnh phúc"></Textarea>
              </Field>

              <Field label="Ví dụ (Tùy chọn)">

                <Textarea rows={2} value={formData.example} onChange={e => setFormData({...formData, example: e.target.value})} className="w-full px-3 py-2 border border-[var(--line)] rounded-lg bg-[var(--paper)] focus:outline-none"></Textarea>
              </Field>

              <Field label="Từ đồng nghĩa (Tùy chọn - Phân cách bằng dấu phẩy)">

                <Input aria-label="Từ đồng nghĩa (Tùy chọn - Phân cách bằng dấu phẩy)" value={formData.synonyms} onChange={e => setFormData({...formData, synonyms: e.target.value})} className="w-full px-3 py-2 border border-[var(--line)] rounded-lg bg-[var(--paper)] focus:outline-none" placeholder="happy, joyful" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Chủ đề">

                  <ChoiceSelect aria-label="Chủ đề" value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} className="w-full px-3 py-2 border border-[var(--line)] rounded-lg font-semibold bg-[var(--paper)] cursor-pointer">
                    {TOPICS.map(t => <option key={t} value={t}>{TOPIC_LABELS[t] || t}</option>)}
                  </ChoiceSelect>
                </Field>
                <Field label="Mức độ">

                  <ChoiceSelect aria-label="Mức độ" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})} className="w-full px-3 py-2 border border-[var(--line)] rounded-lg font-semibold bg-[var(--paper)] cursor-pointer">
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </ChoiceSelect>
                </Field>
              </div>

              <div className="flex gap-4 pt-4 mt-4 border-t border-solid border-[var(--line)]">
                <Button type="submit" disabled={isSubmitting} className=" bg-[var(--green)] text-white flex-1 py-3 ">
                  {isSubmitting ? 'Đang lưu...' : 'Lưu lại'}
                </Button>
                <Button type="button" onClick={handleCloseModal} className=" bg-[var(--paper)] text-[var(--ink)] px-6 py-3 ">
                  Hủy
                </Button>
              </div>
            </form></DialogContent></DialogBody></DialogSurface></Dialog>

    </div>
  );
}
