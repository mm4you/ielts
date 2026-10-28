'use client';

import { useConfirmation } from '@/components/ConfirmationProvider';
import PageHeader from '@/components/PageHeader';
import { Button, Checkbox, Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, Field, Input, Textarea, MessageBar } from '@fluentui/react-components';
import { AddRegular } from '@fluentui/react-icons/svg/add';
import { FolderRegular } from '@fluentui/react-icons/svg/folder';
import AppLoading from '@/components/AppLoading';
import { showToast } from '@/components/GlobalToast';
import LoadingState from '@/components/LoadingState';
import { DismissRegular as UiDismissRegular } from '@fluentui/react-icons/svg/dismiss';
import { Speaker2Regular } from '@fluentui/react-icons/svg/speaker';
import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
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

function CollectionsContent() {
  const { confirm } = useConfirmation();
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialCollectionId = searchParams.get('collectionId') || '';
  const initialQ = searchParams.get('q') || '';

  const [collections, setCollections] = useState<Collection[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);

  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [loadingWords, setLoadingWords] = useState(false);
  const [wordSearchQuery, setWordSearchQuery] = useState(initialQ);

  const [playingWordId, setPlayingWordId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Dừng phát âm khi chuyển đổi bộ sưu tập
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingWordId(null);
  }, [selectedCollection]);

  const handlePlayAudio = (wordId: number, wordText: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (playingWordId === wordId) {
      setPlayingWordId(null);
      return;
    }

    const audio = new Audio(`/api/tts?text=${encodeURIComponent(wordText)}&lang=en`);
    audioRef.current = audio;
    setPlayingWordId(wordId);

    audio.play().catch(err => {
      console.warn("Audio play failed:", err);
      setPlayingWordId(null);
    });

    audio.onended = () => {
      setPlayingWordId(null);
      audioRef.current = null;
    };

    audio.onerror = () => {
      setPlayingWordId(null);
      audioRef.current = null;
    };
  };

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

  // Sync selected collection from URL on initial load
  useEffect(() => {
    if (collections.length > 0 && initialCollectionId) {
      const found = collections.find(c => c.id === initialCollectionId);
      if (found) {
        setSelectedCollection(found);
      }
    }
  }, [collections, initialCollectionId]);

  // Sync state changes back to URL query parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCollection) {
      params.set('collectionId', selectedCollection.id);
    }
    if (wordSearchQuery) {
      params.set('q', wordSearchQuery);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [selectedCollection, wordSearchQuery, router, pathname]);

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

  const notifyError = (message: string) => showToast(message, false);

  // Handle Delete Collection
  const handleDeleteCollection = async (col: Collection) => {
    if (!await confirm({ title: 'Xóa bộ sưu tập', description: `Xóa bộ sưu tập "${col.name}"? Hành động này không thể hoàn tác.`, confirmLabel: 'Xóa bộ sưu tập', danger: true })) {
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
        notifyError('Không thể xóa bộ sưu tập, vui lòng thử lại');
      }
    } catch (err) {
      console.error(err);
      notifyError('Lỗi kết nối mạng');
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
        notifyError(`Lỗi khi gỡ từ "${wordText}"`);
      }
    } catch (err) {
      console.error(err);
      notifyError('Lỗi kết nối mạng');
    }
  };

  if (status === 'loading') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <LoadingState label="Đang tải dữ liệu" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center mt-12">
        <div className="panel bg-[var(--paper)] p-8 border border-[var(--line)]">
          <h2 className="text-3xl font-sans font-semibold mb-4 text-[var(--ink)]">Bộ Sưu Tập</h2>
          <p className="text-sm font-semibold text-[var(--muted)] mb-8">
            Đăng nhập để tạo và quản lý các danh mục từ vựng cá nhân, lưu giữ các từ khó và luyện tập riêng biệt.
          </p>
          <button
            onClick={() => signIn('google')}
            className="btn-brutal bg-[var(--blue)] text-white w-full py-3 text-sm font-semibold "
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
    <div className="collections-page">
      <PageHeader title="Bộ sưu tập" description={`${collections.length} bộ từ vựng`} actions={<Button appearance="primary" icon={<AddRegular />} onClick={() => openModal('create')}>Tạo bộ sưu tập</Button>} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Collections list */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-xl font-semibold font-sans border-b border-solid border-[var(--line)] pb-2 text-[var(--ink)]">
            Bộ từ vựng ({collections.length})
          </h2>

          {loadingCollections ? (
            <LoadingState label="Đang tải các bộ sưu tập" />
          ) : collections.length === 0 ? (
            <div className="panel p-6 text-center bg-[var(--bg)] border border-solid border-[var(--line)] shadow-none">
              <p className="font-semibold text-[var(--muted)] mb-4">Bạn chưa tạo bộ sưu tập nào.</p>
              <button
                onClick={() => openModal('create')}
                className="text-sm font-semibold text-[var(--blue)] underline font-sans"
              >
                Tạo bộ sưu tập
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {collections.map(col => {
                const isActive = selectedCollection?.id === col.id;
                return (
                  <div
                    key={col.id}
                    role="button" tabIndex={0} aria-pressed={isActive} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setSelectedCollection(prev => prev?.id === col.id ? null : col); } }} onClick={() => setSelectedCollection(prev => prev?.id === col.id ? null : col)}
                    className={`panel p-5 cursor-pointer transition-all border border-[var(--line)] flex flex-col justify-between ${ isActive ? 'bg-[var(--brand-soft)] border-[var(--blue)]' : 'bg-[var(--paper)] ' }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="text-xl font-semibold text-[var(--ink)] line-clamp-1">
                          {col.name}
                        </h3>
                        <span className={`font-sans text-[10px] px-2.5 py-1 rounded-md border border-[var(--line)] font-semibold ${ col.isPublic ? 'bg-[var(--brand-soft)] text-[var(--blue)]' : 'bg-[var(--bg)] text-[var(--muted)]' }`}>
                          {col.isPublic ? 'Công khai' : 'Riêng tư'}
                        </span>
                      </div>

                      {col.description && (
                        <p className="text-xs text-[var(--muted)] font-medium mb-4 line-clamp-2">
                          {col.description}
                        </p>
                      )}

                      <p className="text-xs font-sans font-semibold text-[var(--blue)] mb-4">
                        Số lượng: {col._count?.words || 0} từ
                      </p>
                    </div>

                    {/* Quick Study Modes & Metadata Actions */}
                    <div className="border-t border-solid border-[var(--line)] pt-3 flex flex-wrap gap-2 items-center justify-between">
                      {/* Study Buttons */}
                      <div className="flex flex-wrap gap-1.5" onClick={e => e.stopPropagation()}>
                        <Link
                          href={`/review?collectionId=${col.id}`}
                          className="text-[10px] font-sans font-semibold px-2 py-1 rounded bg-[var(--blue)] text-white hover:brightness-110 border border-[var(--line)]"
                        >
                          Ôn tập
                        </Link>
                        <Link
                          href={`/speedrun?collectionId=${col.id}`}
                          className="text-[10px] font-sans font-semibold px-2 py-1 rounded bg-[var(--brand-soft)] text-[var(--blue)] hover:brightness-105 border border-[var(--line)]"
                        >
                          Tốc chiến
                        </Link>
                        <Link
                          href={`/sniper?collectionId=${col.id}`}
                          className="text-xs font-sans font-medium px-2 py-1 rounded bg-[var(--bg)] text-[var(--ink)] hover:brightness-110 border border-[var(--line)]"
                        >
                          Thiện xạ
                        </Link>
                        <Link
                          href={`/match?collectionId=${col.id}`}
                          className="text-xs font-sans font-medium px-2 py-1 rounded bg-[var(--bg)] text-[var(--ink)] hover:brightness-110 border border-[var(--line)]"
                        >
                          Ghép cặp
                        </Link>
                      </div>

                      {/* Edit/Delete Actions */}
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => openModal('edit', col)}
                          className="text-[10px] font-sans font-semibold text-[var(--blue)] hover:underline px-1 py-1"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteCollection(col)}
                          className="text-[10px] font-sans font-semibold text-[var(--red)] hover:underline px-1 py-1"
                        >
                          Xóa
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
            <div className="panel bg-[var(--paper)] p-6 border border-[var(--line)] ">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-solid border-[var(--line)] pb-4 mb-4 w-full">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl font-semibold text-[var(--ink)] truncate">
                      {selectedCollection.name}
                    </h2>
                    <span className={`font-sans text-[10px] px-2.5 py-1 rounded-md border border-[var(--line)] shrink-0 font-semibold ${ selectedCollection.isPublic ? 'bg-[var(--brand-soft)] text-[var(--blue)]' : 'bg-[var(--bg)] text-[var(--muted)]' }`}>
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
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/review?collectionId=${selectedCollection.id}`}
                    className="btn-brutal bg-[var(--blue)] text-white text-xs px-3 py-1.5 font-semibold "
                  >
                    Ôn tập
                  </Link>
                  <Link
                    href={`/speedrun?collectionId=${selectedCollection.id}`}
                    className="btn-brutal bg-[var(--brand-soft)] text-[var(--blue)] text-xs px-3 py-1.5 font-semibold "
                  >
                    Tốc chiến
                  </Link>
                </div>
              </div>

              {/* Word Search Inside Selected Collection */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Tìm từ vựng trong bộ này..."
                  value={wordSearchQuery}
                  onChange={(e) => setWordSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-[var(--line)] rounded-lg font-semibold bg-[var(--paper)] focus:outline-none transition-shadow placeholder-gray-400 font-sans text-sm"
                />
              </div>

              {/* Word List */}
              {loadingWords ? (
                <LoadingState label="Đang tải danh sách từ vựng" />
              ) : words.length === 0 ? (
                <div className="py-12 text-center text-[var(--muted)] font-semibold">
                  Chưa có từ vựng nào trong bộ sưu tập này.
                  <br />
                  <Link href="/library" className="text-[var(--blue)] underline font-sans text-xs mt-2 block">
                    Đến Thư Viện để thêm từ
                  </Link>
                </div>
              ) : filteredWords.length === 0 ? (
                <p className="py-8 text-center text-xs font-semibold text-[var(--muted)]">
                  Không tìm thấy từ vựng khớp với "{wordSearchQuery}"
                </p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {filteredWords.map((word) => {
                    const { pos, en, vi } = parseMeaning(word.meaning_vi, word.pos);
                    return (
                      <div
                        key={word.id}
                        className="panel p-3 border border-[var(--line)] bg-[var(--paper)] transition-all flex items-center justify-between gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/word/${word.id}`}
                              className="font-semibold text-[var(--ink)] hover:text-[var(--blue)] hover:underline text-lg truncate"
                            >
                              {word.word}
                            </Link>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handlePlayAudio(word.id, word.word);
                              }}
                              className={`p-1 rounded-md border border-[var(--line)] transition-all flex items-center justify-center cursor-pointer select-none relative z-20 ${playingWordId === word.id ? 'bg-[var(--green)] text-white translate-y-0.5 shadow-none' : 'bg-[var(--bg)] hover:bg-[var(--brand-soft)] text-[var(--blue)] active:shadow-none' }`}
                              title="Phát âm"
                            >
                              {playingWordId === word.id ? (
                                <Speaker2Regular aria-hidden="true" className="w-3.5 h-3.5 " />
                              ) : (
                                <Speaker2Regular aria-hidden="true" className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {word.ipa && (
                              <span className="text-xs text-[var(--muted)] font-sans">
                                {word.ipa}
                              </span>
                            )}
                            <span className="bg-[var(--brand-soft)] text-[var(--blue)] border border-[var(--line)] font-semibold text-[10px] px-2 py-0.5 rounded-md shrink-0">
                              {word.level}
                            </span>
                          </div>
                          <div className="text-xs text-[var(--muted)] font-medium mt-1 truncate">
                            {pos && (
                              <span className="bg-[var(--bg)] text-[var(--muted)] border border-[var(--line)] px-1.5 py-0.5 rounded-md font-sans text-[9px] font-semibold mr-1.5 ">
                                {pos}
                              </span>
                            )}
                            <span className="font-semibold text-[var(--ink)]">{en}</span>
                            {vi && <span> — {vi}</span>}
                          </div>
                        </div>

                        {/* Remove Action */}
                        <button
                          onClick={() => handleRemoveWord(word.id, word.word)}
                          className="font-sans text-xs text-[var(--red)] font-semibold border border-[var(--red)] px-2 py-1 rounded bg-[var(--danger-soft)] hover:bg-[var(--danger-soft)] select-none cursor-pointer"
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
            <div className="panel bg-[var(--paper)] p-12 border border-solid border-[var(--line)] text-center text-[var(--muted)] font-semibold ">
              Chọn bộ sưu tập để xem từ đã lưu.
            </div>
          )}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(_,data)=>{if(!submitting)setIsModalOpen(data.open);}}><DialogSurface className="collection-dialog"><DialogBody><DialogTitle action={<Button appearance="subtle" aria-label="Đóng" icon={<UiDismissRegular />} disabled={submitting} onClick={()=>setIsModalOpen(false)} />}>{modalMode==='create'?'Tạo bộ sưu tập':'Sửa bộ sưu tập'}</DialogTitle><DialogContent><form id="collection-form" onSubmit={handleFormSubmit} className="collection-fields"><Field label="Tên bộ sưu tập" required><Input value={formName} maxLength={50} required onChange={(_,data)=>setFormName(data.value)} placeholder="Ví dụ: IELTS Writing" /></Field><Field label="Mô tả" hint="Không bắt buộc"><Textarea value={formDescription} maxLength={150} rows={3} onChange={(_,data)=>setFormDescription(data.value)} /></Field><Checkbox label="Công khai bộ sưu tập" checked={formIsPublic} onChange={(_,data)=>setFormIsPublic(data.checked===true)} />{formError&&<MessageBar intent="error">{formError}</MessageBar>}</form></DialogContent><DialogActions><Button disabled={submitting} onClick={()=>setIsModalOpen(false)}>Hủy</Button><Button appearance="primary" type="submit" form="collection-form" disabled={submitting}>{submitting?'Đang lưu':'Lưu'}</Button></DialogActions></DialogBody></DialogSurface></Dialog>

    </div>
  );
}

export default function CollectionsPage() {
  return (
    <Suspense fallback={<AppLoading contained />}>
      <CollectionsContent />
    </Suspense>
  );
}
