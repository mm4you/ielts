'use client';

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

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal body */}
        <div 
          className="bg-[var(--paper)] border-[3px] border-[var(--line)] shadow-[8px_8px_0_var(--line)] rounded-2xl p-6 max-w-md w-full z-55 relative max-h-[90vh] overflow-y-auto transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 border-2 border-[var(--line)] bg-[var(--red)] text-white font-black rounded-lg flex items-center justify-center cursor-pointer shadow-[2px_2px_0_var(--line)] hover:translate-y-0.5 hover:shadow-none transition-all active:scale-95"
            aria-label="Đóng"
          >
            ✕
          </button>

          <h2 className="text-2xl font-bold font-serif text-[var(--ink)] mb-4 border-b-2 border-dashed border-[var(--line)] pb-2 pr-8">
            Góp Ý & Báo Lỗi
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Type field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="feedback-type" className="text-xs font-black uppercase tracking-wider text-[var(--muted)]">
                Phân loại góp ý
              </label>
              <select
                id="feedback-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-[var(--bg)] border-2 border-[var(--line)] rounded-xl py-2.5 px-3 text-sm font-bold text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] shadow-[2px_2px_0_var(--line)] disabled:opacity-50"
              >
                <option value="bug">🐛 Lỗi hệ thống (Bug report)</option>
                <option value="feature">💡 Đề xuất tính năng (Feature request)</option>
                <option value="vocab">📚 Góp ý từ vựng (Vocabulary feedback)</option>
                <option value="other">💬 Ý kiến khác (Other)</option>
              </select>
            </div>

            {/* Message field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="feedback-message" className="text-xs font-black uppercase tracking-wider text-[var(--muted)]">
                Nội dung góp ý <span className="text-[var(--red)]">*</span>
              </label>
              <textarea
                id="feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                disabled={isSubmitting}
                rows={4}
                maxLength={1000}
                placeholder="Nhập chi tiết ý kiến hoặc lỗi bạn gặp phải..."
                className="w-full bg-[var(--bg)] border-2 border-[var(--line)] rounded-xl py-2.5 px-3 text-sm font-bold text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] shadow-[2px_2px_0_var(--line)] placeholder:text-gray-400 disabled:opacity-50 resize-y"
              />
              <div className="text-right text-[10px] font-mono text-[var(--muted)] mt-0.5">
                {message.length}/1000 ký tự
              </div>
            </div>

            {/* Contact field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="feedback-contact" className="text-xs font-black uppercase tracking-wider text-[var(--muted)]">
                Email / Số điện thoại liên hệ (Không bắt buộc)
              </label>
              <input
                id="feedback-contact"
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                disabled={isSubmitting}
                placeholder="email@example.com hoặc số điện thoại"
                className="w-full bg-[var(--bg)] border-2 border-[var(--line)] rounded-xl py-2.5 px-3 text-sm font-bold text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] shadow-[2px_2px_0_var(--line)] placeholder:text-gray-400 disabled:opacity-50"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end mt-2 pt-4 border-t-2 border-dashed border-[var(--line)]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="btn-brutal text-sm py-2 px-4 shadow-[2px_2px_0px_var(--line)] hover:translate-y-0.5 hover:shadow-none"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary text-sm py-2 px-4 shadow-[2px_2px_0px_var(--line)] hover:translate-y-0.5 hover:shadow-none flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang gửi...
                  </>
                ) : (
                  'Gửi góp ý'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
