'use client';


import { Button, Input, Popover, PopoverSurface, PopoverTrigger, Spinner } from '@fluentui/react-components';
import { BookmarkRegular, BookmarkFilled } from '@fluentui/react-icons/svg/bookmark';
import { AddRegular } from '@fluentui/react-icons/svg/add';
import { CheckmarkRegular } from '@fluentui/react-icons/svg/checkmark';
import LoadingState from '@/components/LoadingState';
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
      showToast('Không thể tạo bộ sưu tập. Vui lòng thử lại.', false);
    } finally {
      setCreatingCollection(false);
    }
  };

  return <span className={className} onClick={e=>e.stopPropagation()}><Popover open={showDropdown} onOpenChange={(_,data)=>{setShowDropdown(data.open);if(data.open)fetchCollections();}} positioning="below-end" withArrow><PopoverTrigger disableButtonEnhancement><Button appearance="subtle" size="small" disabled={loading} aria-label={isSaved?'Sửa bộ sưu tập đã lưu':'Lưu vào bộ sưu tập'} icon={loading?<Spinner size="tiny" />:isSaved?<BookmarkFilled />:<BookmarkRegular />} className={isSaved?'save-word-button is-saved':'save-word-button'}>{isSaved?'Đã lưu':'Lưu'}</Button></PopoverTrigger><PopoverSurface className="save-collection-popover" onClick={e=>e.stopPropagation()}><h3>Lưu vào bộ sưu tập</h3>{loadingCollections?<LoadingState label="Đang tải bộ sưu tập" />:collections.length===0?<p className="save-collection-empty">Chưa có bộ sưu tập.</p>:<div className="save-collection-list">{collections.map(col=><Button key={col.id} appearance="subtle" aria-pressed={savedCollectionIds.includes(col.id)} onClick={e=>handleToggle(e,col.id)} icon={savedCollectionIds.includes(col.id)?<CheckmarkRegular />:undefined}>{col.name}</Button>)}</div>}<form onSubmit={handleCreateAndAdd} className="save-collection-form"><Input aria-label="Tên bộ sưu tập mới" placeholder="Bộ sưu tập mới" value={newCollectionName} onChange={(_,data)=>setNewCollectionName(data.value)} maxLength={40} disabled={creatingCollection} /><Button type="submit" appearance="primary" aria-label="Tạo và lưu" icon={creatingCollection?<Spinner size="tiny" />:<AddRegular />} disabled={creatingCollection||!newCollectionName.trim()} /></form></PopoverSurface></Popover></span>;
}
