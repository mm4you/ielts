'use client';

import { useState } from 'react';
import { Word, TOPICS, LEVELS, TOPIC_LABELS } from '@/types';
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
  const [users] = useState<UserData[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    word: '',
    ipa: '',
    meaning_vi: '',
    example: '',
    synonyms: '',
    topic: TOPICS[0] as string,
    level: LEVELS[0] as string,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredWords = words.filter(w => 
    w.word.toLowerCase().includes(search.toLowerCase()) || 
    w.meaning_vi.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (word?: Word) => {
    if (word) {
      setEditingWord(word);
      setFormData({
        word: word.word,
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-black font-serif text-[var(--ink)] uppercase">Quản Trị Hệ Thống</h1>
        </div>
        {activeTab === 'words' && (
          <button 
            onClick={() => handleOpenModal()} 
            className="btn-brutal bg-[var(--yellow)] text-[var(--ink)] px-6 py-3 uppercase"
          >
            + Thêm Từ Mới
          </button>
        )}
      </div>

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

      {activeTab === 'words' && (
        <>
          <div className="mb-6">
            <input
              type="text"
              placeholder="Tìm kiếm từ vựng..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full max-w-md px-4 py-3 border-[3px] border-[var(--line)] rounded-xl bg-[var(--paper)] font-bold shadow-[4px_4px_0_var(--line)] focus:outline-none focus:shadow-[4px_4px_0_var(--blue)]"
            />
          </div>

          <div className="panel overflow-hidden p-0 rounded-xl border-[3px] border-[var(--line)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--line)] text-white text-sm uppercase">
                <th className="px-4 py-3 font-bold border-r border-[var(--paper)]">ID</th>
                <th className="px-4 py-3 font-bold border-r border-[var(--paper)]">Từ Vựng</th>
                <th className="px-4 py-3 font-bold border-r border-[var(--paper)]">Chủ Đề</th>
                <th className="px-4 py-3 font-bold border-r border-[var(--paper)]">Mức Độ</th>
                <th className="px-4 py-3 font-bold text-center">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredWords.map((word) => {
                const { en, vi } = parseMeaning(word.meaning_vi);
                return (
                  <tr key={word.id} className="border-b border-[var(--line)] last:border-b-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm border-r border-[var(--line)]">{word.id}</td>
                    <td className="px-4 py-3 border-r border-[var(--line)]">
                      <p className="font-black text-[var(--blue)] text-lg">{word.word}</p>
                      <p className="text-sm font-bold opacity-70">{en}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold border-r border-[var(--line)]">{TOPIC_LABELS[word.topic] || word.topic}</td>
                    <td className="px-4 py-3 text-sm font-bold border-r border-[var(--line)]">{word.level}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleOpenModal(word)} className="btn-brutal bg-[var(--blue)] text-white text-xs px-3 py-1">Sửa</button>
                        <button onClick={() => handleDelete(word.id)} className="btn-brutal bg-[var(--red)] text-white text-xs px-3 py-1">Xóa</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredWords.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 font-bold text-[var(--muted)]">Không tìm thấy từ vựng nào</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {activeTab === 'users' && (
        <div className="panel overflow-hidden p-0 rounded-xl border-[3px] border-[var(--line)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--line)] text-white text-sm uppercase">
                  <th className="px-4 py-3 font-bold border-r border-[var(--paper)]">Học Viên</th>
                  <th className="px-4 py-3 font-bold border-r border-[var(--paper)]">Email</th>
                  <th className="px-4 py-3 font-bold border-r border-[var(--paper)]">Từ đang học</th>
                  <th className="px-4 py-3 font-bold border-r border-[var(--paper)]">Quyền</th>
                  <th className="px-4 py-3 font-bold">Ngày tham gia</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-[var(--line)] last:border-b-0 hover:bg-gray-50">
                    <td className="px-4 py-3 border-r border-[var(--line)]">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-[var(--yellow)] border-2 border-[var(--line)] flex items-center justify-center font-bold text-[var(--ink)] text-xs shadow-[2px_2px_0_var(--line)]">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                        <span className="font-bold text-[var(--ink)]">{user.name || 'Người dùng ẩn danh'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm border-r border-[var(--line)]">{user.email}</td>
                    <td className="px-4 py-3 text-center border-r border-[var(--line)]">
                      <span className="font-black text-[var(--blue)] text-lg">{user._count.progress}</span>
                    </td>
                    <td className="px-4 py-3 border-r border-[var(--line)]">
                      {user.email === 'ungnhutkhang53@gmail.com' ? (
                        <span className="bg-[var(--yellow)] text-[var(--ink)] text-[10px] px-2 py-0.5 rounded-full font-bold border border-[var(--line)]">ADMIN</span>
                      ) : (
                        <span className="text-xs font-bold text-[var(--muted)]">Học viên</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--muted)]">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-[var(--bg)]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="panel max-w-2xl w-full bg-[var(--paper)] my-8">
            <h2 className="text-2xl font-black mb-6 uppercase">{editingWord ? 'Sửa Từ Vựng' : 'Thêm Từ Mới'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Từ vựng (Tiếng Anh)</label>
                  <input required value={formData.word} onChange={e => setFormData({...formData, word: e.target.value})} className="w-full px-3 py-2 border-[2px] border-[var(--line)] rounded-lg font-bold" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Phiên âm (IPA) - Tùy chọn</label>
                  <input value={formData.ipa} onChange={e => setFormData({...formData, ipa: e.target.value})} className="w-full px-3 py-2 border-[2px] border-[var(--line)] rounded-lg font-mono" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Nghĩa (Định dạng: Nghĩa tiếng Anh ||| Nghĩa tiếng Việt)</label>
                <textarea required rows={3} value={formData.meaning_vi} onChange={e => setFormData({...formData, meaning_vi: e.target.value})} className="w-full px-3 py-2 border-[2px] border-[var(--line)] rounded-lg font-bold" placeholder="to be extremely happy ||| Vô cùng hạnh phúc"></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Ví dụ (Tùy chọn)</label>
                <textarea rows={2} value={formData.example} onChange={e => setFormData({...formData, example: e.target.value})} className="w-full px-3 py-2 border-[2px] border-[var(--line)] rounded-lg"></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Từ đồng nghĩa (Tùy chọn - Phân cách bằng dấu phẩy)</label>
                <input value={formData.synonyms} onChange={e => setFormData({...formData, synonyms: e.target.value})} className="w-full px-3 py-2 border-[2px] border-[var(--line)] rounded-lg" placeholder="happy, joyful" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Chủ đề</label>
                  <select value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} className="w-full px-3 py-2 border-[2px] border-[var(--line)] rounded-lg font-bold">
                    {TOPICS.map(t => <option key={t} value={t}>{TOPIC_LABELS[t] || t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Mức độ</label>
                  <select value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})} className="w-full px-3 py-2 border-[2px] border-[var(--line)] rounded-lg font-bold">
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4 mt-4 border-t-2 border-dashed border-[var(--line)]">
                <button type="submit" disabled={isSubmitting} className="btn-brutal bg-[var(--green)] text-white flex-1 py-3 uppercase">
                  {isSubmitting ? 'Đang lưu...' : 'Lưu lại'}
                </button>
                <button type="button" onClick={handleCloseModal} className="btn-brutal bg-[var(--paper)] text-[var(--ink)] px-6 py-3 uppercase">
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
