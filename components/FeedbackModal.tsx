'use client';


import { DismissRegular } from '@fluentui/react-icons/svg/dismiss';
import { Button, Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, Field, Input, Select, Textarea, Spinner } from '@fluentui/react-components';
import { useState, useEffect } from 'react';
import { showToast } from '@/components/GlobalToast';

export function openFeedbackModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-feedback-modal'));
  }
}

export default function FeedbackModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState('bug');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-feedback-modal', handleOpen);
    return () => {
      window.removeEventListener('open-feedback-modal', handleOpen);
    };
  }, []);

  if (!isOpen) return null;

  const onClose = () => {
    setIsOpen(false);
    // Reset form states on close
    setMessage('');
    setContact('');
    setType('bug');
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      showToast('Nội dung góp ý không được bỏ trống!', false);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, message, contact }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(data.message || 'Cảm ơn góp ý của bạn!', true);
        // Reset form
        setMessage('');
        setContact('');
        setType('bug');
        onClose();
      } else {
        showToast(data.error || 'Có lỗi xảy ra, vui lòng thử lại!', false);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showToast('Lỗi kết nối. Vui lòng kiểm tra lại mạng!', false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return <Dialog open={isOpen} onOpenChange={(_,data)=>{if(!data.open&&!isSubmitting)onClose();}}>
    <DialogSurface className="feedback-dialog"><form onSubmit={handleSubmit}><DialogBody>
      <DialogTitle action={<Button appearance="subtle" icon={<DismissRegular />} aria-label="Đóng góp ý" disabled={isSubmitting} onClick={onClose} />}>Góp ý hệ thống</DialogTitle>
      <DialogContent className="feedback-fields">
        <Field label="Phân loại"><Select value={type} onChange={e=>setType(e.target.value)} disabled={isSubmitting}><option value="bug">Lỗi hệ thống</option><option value="feature">Đề xuất tính năng</option><option value="vocab">Góp ý từ vựng</option><option value="other">Ý kiến khác</option></Select></Field>
        <Field label="Nội dung" required hint={message.length+'/1000 ký tự'}><Textarea value={message} onChange={(_,data)=>setMessage(data.value)} required maxLength={1000} rows={5} disabled={isSubmitting} resize="vertical" placeholder="Mô tả vấn đề hoặc đề xuất" /></Field>
        <Field label="Liên hệ" hint="Không bắt buộc"><Input value={contact} onChange={(_,data)=>setContact(data.value)} disabled={isSubmitting} placeholder="Email hoặc số điện thoại" /></Field>
      </DialogContent>
      <DialogActions><Button appearance="secondary" onClick={onClose} disabled={isSubmitting}>Hủy</Button><Button appearance="primary" type="submit" disabled={isSubmitting} icon={isSubmitting?<Spinner size="tiny" />:undefined}>{isSubmitting?'Đang gửi':'Gửi góp ý'}</Button></DialogActions>
    </DialogBody></form></DialogSurface>
  </Dialog>;
}
