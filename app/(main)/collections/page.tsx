'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { parseMeaning } from '@/lib/parse';

interface Collection {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    words: number;
  };
}

interface Word {
  id: number;
  word: string;
  pos: string | null;
  ipa: string | null;
  meaning_vi: string;
  level: string;
  topic: string;
}

export default function CollectionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [loadingWords, setLoadingWords] = useState(false);
  const [wordSearchQuery, setWordSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [targetCollectionId, setTargetCollectionId] = useState<string>('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsPublic, setFormIsPublic] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch collections list
  const fetchCollections = useCallback(async () => {
    setLoadingCollections(true);
    try {
      const res = await fetch('/api/collections');
      if (res.ok) {
        const data = await res.json();
        setCollections(data);
      }
    } catch (e) {
      console.error('Lỗi khi tải danh sách bộ sưu tập:', e);
    } finally {
      setLoadingCollections(false);
    }
  }, []);

  // Fetch words in selected collection
  const fetchCollectionWords = useCallback(async (collectionId: string) => {
    setLoadingWords(true);
    try {
      const res = await fetch(`/api/collections/${collectionId}/words`);
      if (res.ok) {
        const data = await res.json();
        setWords(data.words || []);
      }
    } catch (e) {
      console.error('Lỗi khi tải từ vựng trong bộ sưu tập:', e);
    } finally {
      setLoadingWords(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchCollections();
    }
  }, [session, fetchCollections]);

  useEffect(() => {
    if (selectedCollection) {
      fetchCollectionWords(selectedCollection.id);
    } else {
      setWords([]);
    }
  }, [selectedCollection, fetchCollectionWords]);

  // Handle Create/Edit Modal Open
  const openModal = (mode: 'create' | 'edit', col?: Collection) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && col) {
      setTargetCollectionId(col.id);
      setFormName(col.name);
      setFormDescription(col.description || '');
      setFormIsPublic(col.isPublic);
    } else {
      setTargetCollectionId('');
      setFormName('');
      setFormDescription('');
      setFormIsPublic(false);
    }
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Vui lòng nhập tên bộ sưu tập');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const url = modalMode === 'create' ? '/api/collections' : `/api/collections/${targetCollectionId}`;
      const method = modalMode === 'create' ? 'POST' : 'PATCH';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          isPublic: formIsPublic,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setIsModalOpen(false);
        fetchCollections();
        
        // If editing currently selected collection, update details
        if (modalMode === 'edit' && selectedCollection?.id === targetCollectionId) {
          setSelectedCollection(updated);
        }
      } else {
        const errData = await res.json();
        setFormError(errData.error || 'Có lỗi xảy ra, vui lòng thử lại');
      }
    } catch (err) {
      console.error(err);
      setFormError('Lỗi kết nối mạng, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Collection
  const handleDeleteCollection = async (col: Collection) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bộ sưu tập "${col.name}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/collections/${col.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchCollections();
        if (selectedCollection?.id === col.id) {
          setSelectedCollection(null);
        }
      } else {
        alert('Không thể xóa bộ sưu tập, vui lòng thử lại');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối mạng');
    }
  };

  // Handle Remove Word from Collection
  const handleRemoveWord = async (wordId: number, wordText: string) => {
    if (!selectedCollection) return;
    
    try {
      const res = await fetch(`/api/collections/${selectedCollection.id}/words/${wordId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Optimistically update list
        setWords(prev => prev.filter(w => w.id !== wordId));
        // Update collection list count
        setCollections(prev => 
          prev.map(c => 
            c.id === selectedCollection.id 
              ? { ...c, _count: { words: Math.max((c._count?.words || 1) - 1, 0) } } 
              : c
          )
        );
      } else {
        alert(`Lỗi khi gỡ từ "${wordText}"`);
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối mạng');
    }
  };

  if (status === 'loading') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-xl font-bold font-mono animate-pulse text-[var(--ink)]">[ ĐANG TẢI DỮ LIỆU... ]</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center mt-12">
        <div className="panel bg-[var(--paper)] p-8 shadow-[8px_8px_0_var(--line)] border-[3px] border-[var(--line)]">
          <h2 className="text-3xl font-serif font-black uppercase mb-4 text-[var(--ink)]">Bộ Sưu Tập</h2>
          <p className="text-sm font-bold text-[var(--muted)] mb-8">
            Đăng nhập để tạo và quản lý các danh mục từ vựng cá nhân, lưu giữ các từ khó và luyện tập riêng biệt.
          </p>
          <button
            onClick={() => signIn('google')}
            className="btn-brutal bg-[var(--blue)] text-white w-full py-3 text-sm font-bold uppercase shadow-[4px_4px_0_var(--line)] hover:translate-y-0.5"
          >
            Đăng Nhập Bằng Google
          </button>
        </div>
      </div>
    );
  }

  // Filter words inside selected collection based on search query
  const filteredWords = words.filter(word => {
    const query = wordSearchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      word.word.toLowerCase().includes(query) ||
      word.meaning_vi.toLowerCase().includes(query)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 mt-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif font-black uppercase text-[var(--ink)] tracking-tight">
            Bộ Sưu Tập
          </h1>
          <p className="text-[var(--muted)] font-bold mt-1">
            Quản lý kho từ vựng cá nhân và bắt đầu ôn luyện
          </p>
        </div>
        <button
          onClick={() => openModal('create')}
          className="btn-brutal bg-[var(--yellow)] text-[var(--ink)] px-6 py-3 font-bold text-sm uppercase self-start md:self-auto shadow-[4px_4px_0_var(--line)] hover:-translate-y-0.5"
        >
          [ + Tạo Bộ Mới ]
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Collections list */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-xl font-bold font-mono uppercase border-b-2 border-dashed border-[var(--line)] pb-2 text-[var(--ink)]">
            Danh sách bộ ({collections.length})
          </h2>

          {loadingCollections ? (
            <p className="font-mono text-sm opacity-50">[ Đang tải các bộ sưu tập... ]</p>
          ) : collections.length === 0 ? (
            <div className="panel p-6 text-center bg-gray-50 border-2 border-dashed border-[var(--line)]">
              <p className="font-bold text-[var(--muted)] mb-4">Bạn chưa tạo bộ sưu tập nào.</p>
              <button
                onClick={() => openModal('create')}
                className="text-sm font-bold text-[var(--blue)] underline font-mono"
              >
                Tạo sổ tay từ vựng đầu tiên ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {collections.map(col => {
                const isActive = selectedCollection?.id === col.id;
                return (
                  <div
                    key={col.id}
                    onClick={() => setSelectedCollection(prev => prev?.id === col.id ? null : col)}
                    className={`panel p-5 cursor-pointer transition-all border-[3px] border-[var(--line)] flex flex-col justify-between ${
                      isActive
                        ? 'bg-[var(--paper)] shadow-[6px_6px_0_var(--blue)] border-[var(--blue)] -translate-y-1'
                        : 'bg-[var(--paper)] shadow-[4px_4px_0_var(--line)] hover:shadow-[6px_6px_0_var(--line)] hover:-translate-y-0.5'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="text-xl font-extrabold text-[var(--ink)] line-clamp-1">
                          {col.name}
                        </h3>
                        <span className={`font-mono text-[9px] px-2 py-0.5 rounded border border-[var(--line)] ${
                          col.isPublic ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {col.isPublic ? 'Công khai' : 'Riêng tư'}
                        </span>
                      </div>
                      
                      {col.description && (
                        <p className="text-xs text-[var(--muted)] font-medium mb-4 line-clamp-2">
                          {col.description}
                        </p>
                      )}

                      <p className="text-xs font-mono font-bold text-[var(--blue)] mb-4">
                        Số lượng: {col._count?.words || 0} từ
                      </p>
                    </div>

                    {/* Quick Study Modes & Metadata Actions */}
                    <div className="border-t border-dashed border-[var(--line)] pt-3 flex flex-wrap gap-2 items-center justify-between">
                      {/* Study Buttons */}
                      <div className="flex flex-wrap gap-1.5" onClick={e => e.stopPropagation()}>
                        <Link
                          href={`/review?collectionId=${col.id}`}
                          className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-[var(--blue)] text-white hover:brightness-110 shadow-[1px_1px_0_var(--line)] border border-[var(--line)]"
                        >
                          Ôn tập
                        </Link>
                        <Link
                          href={`/speedrun?collectionId=${col.id}`}
                          className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-[var(--yellow)] text-[var(--ink)] hover:brightness-105 shadow-[1px_1px_0_var(--line)] border border-[var(--line)]"
                        >
                          Tốc chiến
                        </Link>
                        <Link
                          href={`/sniper?collectionId=${col.id}`}
                          className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-[var(--red)] text-white hover:brightness-110 shadow-[1px_1px_0_var(--line)] border border-[var(--line)]"
                        >
                          Thiện xạ
                        </Link>
                        <Link
                          href={`/match?collectionId=${col.id}`}
                          className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-[var(--green)] text-white hover:brightness-110 shadow-[1px_1px_0_var(--line)] border border-[var(--line)]"
                        >
                          Ghép cặp
                        </Link>
                      </div>

                      {/* Edit/Delete Actions */}
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => openModal('edit', col)}
                          className="text-[10px] font-mono font-bold text-[var(--blue)] hover:underline px-1 py-1"
                        >
                          [ Sửa ]
                        </button>
                        <button
                          onClick={() => handleDeleteCollection(col)}
                          className="text-[10px] font-mono font-bold text-[var(--red)] hover:underline px-1 py-1"
                        >
                          [ Xóa ]
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: Selected collection words detail */}
        <div className="lg:col-span-7 space-y-6">
          {selectedCollection ? (
            <div className="panel bg-[var(--paper)] p-6 border-[3px] border-[var(--line)] shadow-[6px_6px_0_var(--line)]">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-dashed border-[var(--line)] pb-4 mb-4 w-full">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl font-black text-[var(--ink)] uppercase truncate">
                      {selectedCollection.name}
                    </h2>
                    <span className={`font-mono text-[9px] px-2 py-0.5 rounded border border-[var(--line)] shrink-0 ${
                      selectedCollection.isPublic ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {selectedCollection.isPublic ? 'Công khai' : 'Riêng tư'}
                    </span>
                  </div>
                  {selectedCollection.description && (
                    <p className="text-sm text-[var(--muted)] font-medium mt-1">
                      {selectedCollection.description}
                    </p>
                  )}
                </div>
                
                {/* Mode indicators inside details panel */}
                <div className="flex flex-wrap gap-2 items-center">
                  <Link
                    href={`/review?collectionId=${selectedCollection.id}`}
                    className="btn-brutal bg-[var(--blue)] text-white text-xs px-3 py-1.5 font-bold uppercase shadow-[2px_2px_0_var(--line)] hover:translate-y-0.5"
                  >
                    Ôn tập
                  </Link>
                  <Link
                    href={`/speedrun?collectionId=${selectedCollection.id}`}
                    className="btn-brutal bg-[var(--yellow)] text-[var(--ink)] text-xs px-3 py-1.5 font-bold uppercase shadow-[2px_2px_0_var(--line)] hover:translate-y-0.5"
                  >
                    Tốc chiến
                  </Link>
                  <button 
                    onClick={() => setSelectedCollection(null)} 
                    className="w-8 h-8 border-2 border-[var(--line)] bg-[var(--red)] text-white font-black rounded-lg shadow-[2px_2px_0_var(--line)] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center shrink-0 cursor-pointer select-none ml-1"
                    title="Đóng chi tiết"
                  >
                    X
                  </button>
                </div>
              </div>

              {/* Word Search Inside Selected Collection */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Tìm từ vựng trong bộ này..."
                  value={wordSearchQuery}
                  onChange={(e) => setWordSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-[var(--line)] rounded-lg font-bold bg-[var(--paper)] focus:outline-none focus:shadow-[2px_2px_0_var(--blue)] transition-shadow placeholder-gray-400 font-mono text-sm"
                />
              </div>

              {/* Word List */}
              {loadingWords ? (
                <p className="font-mono text-sm opacity-50 py-10 text-center">[ Đang tải danh sách từ vựng... ]</p>
              ) : words.length === 0 ? (
                <div className="py-12 text-center text-[var(--muted)] font-bold">
                  Chưa có từ vựng nào trong bộ sưu tập này.
                  <br />
                  <Link href="/library" className="text-[var(--blue)] underline font-mono text-xs mt-2 block">
                    Đến Thư Viện để thêm từ
                  </Link>
                </div>
              ) : filteredWords.length === 0 ? (
                <p className="py-8 text-center text-xs font-bold text-[var(--muted)]">
                  Không tìm thấy từ vựng khớp với "{wordSearchQuery}"
                </p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {filteredWords.map((word) => {
                    const { pos, en, vi } = parseMeaning(word.meaning_vi, word.pos);
                    return (
                      <div
                        key={word.id}
                        className="panel p-3 border-2 border-[var(--line)] shadow-[2px_2px_0_var(--line)] bg-[var(--paper)] hover:-translate-y-0.5 transition-all flex items-center justify-between gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/word/${word.id}`}
                              className="font-bold text-[var(--ink)] hover:text-[var(--blue)] hover:underline text-lg truncate"
                            >
                              {word.word}
                            </Link>
                            {word.ipa && (
                              <span className="text-xs text-[var(--muted)] font-mono">
                                {word.ipa}
                              </span>
                            )}
                            <span className="text-[9px] bg-gray-100 text-gray-600 border border-[var(--line)] px-1 py-0.2 rounded font-mono uppercase font-bold">
                              {word.level}
                            </span>
                          </div>
                          <div className="text-xs text-[var(--muted)] font-medium mt-1 truncate">
                            {pos && (
                              <span className="text-[var(--blue)] font-bold mr-1.5">
                                ({pos})
                              </span>
                            )}
                            <span className="font-bold text-[var(--ink)]">{en}</span>
                            {vi && <span> — {vi}</span>}
                          </div>
                        </div>

                        {/* Remove Action */}
                        <button
                          onClick={() => handleRemoveWord(word.id, word.word)}
                          className="font-mono text-xs text-[var(--red)] font-bold border border-[var(--red)] px-2 py-1 rounded bg-red-50 hover:bg-red-100 shadow-[1px_1px_0_var(--red)] select-none cursor-pointer"
                        >
                          Gỡ
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="panel bg-[var(--paper)] p-12 border-2 border-dashed border-[var(--line)] text-center text-[var(--muted)] font-bold shadow-[4px_4px_0_var(--line)]">
              Chọn một bộ sưu tập để hiển thị danh sách từ vựng chi tiết và bắt đầu ôn luyện.
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Collection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="panel max-w-md w-full bg-[var(--paper)] p-6 border-[3px] border-[var(--line)] shadow-[8px_8px_0px_#000] relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-xs font-mono font-bold text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--line)] px-2 py-0.5 rounded shadow-[1px_1px_0_var(--line)] bg-white cursor-pointer select-none"
            >
              [ Đóng ]
            </button>

            <h3 className="text-2xl font-serif font-black uppercase text-[var(--ink)] mb-6 border-b-2 border-dashed border-[var(--line)] pb-2">
              {modalMode === 'create' ? 'Tạo Bộ Sưu Tập Mới' : 'Cập Nhật Bộ Sưu Tập'}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1.5 text-[var(--ink)]">
                  Tên Bộ Sưu Tập <span className="text-[var(--red)]">*</span>
                </label>
                <input
                  type="text"
                  maxLength={50}
                  required
                  placeholder="Ví dụ: Từ vựng IELTS Writing Task 1"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-[var(--line)] rounded-xl font-bold bg-[var(--paper)] focus:outline-none focus:shadow-[2px_2px_0_var(--blue)] transition-shadow placeholder-gray-400 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1.5 text-[var(--ink)]">
                  Mô Tả Chi Tiết (Không bắt buộc)
                </label>
                <textarea
                  maxLength={150}
                  placeholder="Ghi chú về mục tiêu học hoặc chủ đề của bộ từ vựng..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-[var(--line)] rounded-xl font-bold bg-[var(--paper)] focus:outline-none focus:shadow-[2px_2px_0_var(--blue)] transition-shadow placeholder-gray-400 font-mono text-sm resize-none"
                />
              </div>

              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formIsPublic}
                  onChange={(e) => setFormIsPublic(e.target.checked)}
                  className="w-4 h-4 border-2 border-[var(--line)] rounded accent-[var(--blue)] cursor-pointer"
                />
                <label htmlFor="isPublic" className="text-xs font-bold font-mono text-[var(--ink)] cursor-pointer select-none">
                  Công khai bộ sưu tập này cho người khác xem
                </label>
              </div>

              {formError && (
                <p className="text-xs font-mono font-bold text-[var(--red)] py-1">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-brutal bg-[var(--blue)] text-white w-full py-3 text-sm font-bold uppercase shadow-[4px_4px_0_var(--line)] hover:translate-y-0.5"
              >
                {submitting ? 'ĐANG LƯU...' : modalMode === 'create' ? 'TẠO BỘ SƯU TẬP' : 'LƯU THAY ĐỔI'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
