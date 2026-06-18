'use client';

import { useState, useEffect } from 'react';
import { showToast } from '@/components/GlobalToast';

interface SaveToCollectionProps {
  wordId: number;
  wordText?: string;
  className?: string;
  onSaveStatusChange?: (saved: boolean) => void;
}

interface Collection {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
}


export default function SaveToCollection({
  wordId,
  wordText = '',
  className = '',
  onSaveStatusChange,
}: SaveToCollectionProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dropdown States
  const [showDropdown, setShowDropdown] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [savedCollectionIds, setSavedCollectionIds] = useState<string[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [creatingCollection, setCreatingCollection] = useState(false);

  useEffect(() => {
    let active = true;
    const checkSaved = async () => {
      try {
        const res = await fetch(`/api/collections/quick-add?wordId=${wordId}`);
        const data = await res.json();
        if (active && res.ok && data.savedCollectionIds) {
          setSavedCollectionIds(data.savedCollectionIds);
          setIsSaved(data.savedCollectionIds.length > 0);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    };
    checkSaved();
    return () => {
      active = false;
    };
  }, [wordId]);



  const fetchCollections = async () => {
    setLoadingCollections(true);
    try {
      const res = await fetch('/api/collections');
      if (res.ok) {
        const data = await res.json();
        setCollections(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCollections(false);
    }
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextShow = !showDropdown;
    setShowDropdown(nextShow);
    if (nextShow) {
      fetchCollections();
    }
  };

  const handleToggle = async (e: React.MouseEvent, collectionId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const isSavedInCol = savedCollectionIds.includes(collectionId);
    let nextIds: string[];
    if (isSavedInCol) {
      nextIds = savedCollectionIds.filter(id => id !== collectionId);
    } else {
      nextIds = [...savedCollectionIds, collectionId];
    }
    setSavedCollectionIds(nextIds);
    setIsSaved(nextIds.length > 0);
    if (onSaveStatusChange) {
      onSaveStatusChange(nextIds.length > 0);
    }

    try {
      const res = await fetch('/api/collections/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId, collectionId })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          data.added 
            ? `Đã thêm vào: "${data.collection?.name || 'sổ tay'}"` 
            : `Đã gỡ khỏi: "${data.collection?.name || 'sổ tay'}"`,
          data.added
        );
        
        const newIds = data.added 
          ? [...savedCollectionIds.filter(id => id !== collectionId), collectionId]
          : savedCollectionIds.filter(id => id !== collectionId);
        setSavedCollectionIds(newIds);
        setIsSaved(newIds.length > 0);
        if (onSaveStatusChange) {
          onSaveStatusChange(newIds.length > 0);
        }
      }
    } catch (err) {
      console.error(err);
      // Revert on error
      setSavedCollectionIds(savedCollectionIds);
      setIsSaved(savedCollectionIds.length > 0);
    }
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newCollectionName.trim() || creatingCollection) return;

    setCreatingCollection(true);
    try {
      const createRes = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCollectionName.trim() })
      });
      if (!createRes.ok) throw new Error('Create collection failed');
      const newCol = await createRes.json();
      
      setCollections(prev => [newCol, ...prev]);
      setNewCollectionName('');

      const addRes = await fetch('/api/collections/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId, collectionId: newCol.id })
      });
      const addData = await addRes.json();
      if (addRes.ok && addData.added) {
        const nextIds = [...savedCollectionIds, newCol.id];
        setSavedCollectionIds(nextIds);
        setIsSaved(true);
        if (onSaveStatusChange) {
          onSaveStatusChange(true);
        }
        showToast(`Đã lưu vào bộ mới: "${newCol.name}"`, true);
      }
    } catch (err) {
      console.error(err);
      alert('Không thể tạo sổ tay mới');
    } finally {
      setCreatingCollection(false);
    }
  };

  if (loading) {
    return (
      <span className={`text-[10px] font-mono opacity-50 select-none ${className}`}>
        [ ... ]
      </span>
    );
  }

  return (
    <>
      <span className={`inline-flex items-center relative ${className}`}>
        <button
          type="button"
          onClick={handleTriggerClick}
          className={`text-[10px] md:text-xs font-mono font-black px-2.5 py-1 rounded border border-[var(--line)] shadow-[1.5px_1.5px_0_var(--line)] transition-all cursor-pointer select-none hover:scale-102 active:scale-98 ${
            isSaved
              ? 'bg-[var(--green)] text-white hover:brightness-105'
              : 'bg-green-50 text-[var(--green)] hover:bg-green-100'
          }`}
        >
          {isSaved ? 'ĐÃ LƯU' : 'LƯU'}
        </button>

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setShowDropdown(false); }} />
            <div className="absolute right-0 top-full mt-2 w-64 bg-[var(--paper)] border-[3px] border-[var(--line)] shadow-[4px_4px_0_var(--line)] rounded-xl p-3 z-50 text-left font-sans">
              <h4 className="text-xs font-mono font-black uppercase text-[var(--muted)] border-b border-dashed border-[var(--line)] pb-1.5 mb-2">
                Lưu vào sổ tay
              </h4>
              
              {loadingCollections ? (
                <p className="text-[10px] font-mono text-[var(--muted)] py-2 text-center">[ Đang tải... ]</p>
              ) : collections.length === 0 ? (
                <p className="text-[10px] font-mono text-[var(--muted)] py-2 text-center">Chưa có sổ tay nào.</p>
              ) : (
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 mb-3">
                  {collections.map(col => {
                    const isSavedInCol = savedCollectionIds.includes(col.id);
                    return (
                      <button
                        key={col.id}
                        onClick={(e) => handleToggle(e, col.id)}
                        className={`w-full flex items-center justify-between text-left px-2 py-1.5 rounded-lg border-2 border-transparent hover:border-[var(--line)] hover:bg-[var(--bg)] transition-all text-xs font-bold ${
                          isSavedInCol ? 'text-[var(--green)] bg-green-50/50' : 'text-[var(--ink)]'
                        }`}
                      >
                        <span className="truncate flex-1 pr-2">{col.name}</span>
                        <span className="font-mono text-[10px] shrink-0">
                          {isSavedInCol ? '[ ✓ ]' : '[   ]'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              
              <div className="border-t border-dashed border-[var(--line)] pt-2 mt-2" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleCreateAndAdd} className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Tạo sổ tay mới..."
                    value={newCollectionName}
                    onChange={e => setNewCollectionName(e.target.value)}
                    className="flex-1 px-2 py-1 text-xs border border-[var(--line)] rounded bg-[var(--paper)] focus:outline-none focus:border-[var(--blue)] font-bold placeholder-gray-400"
                    maxLength={40}
                    disabled={creatingCollection}
                  />
                  <button
                    type="submit"
                    disabled={creatingCollection || !newCollectionName.trim()}
                    className="px-2 py-1 text-xs bg-[var(--blue)] text-white font-bold rounded hover:brightness-105 disabled:opacity-50"
                  >
                    +
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </span>
    </>
  );
}
