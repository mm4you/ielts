'use client';

import { useEffect, useState } from 'react';
import { Button, Spinner } from '@fluentui/react-components';
import BrandMark from './BrandMark';

export default function AppLoading({ contained = false, label = 'Đang tải trang' }: { contained?: boolean; label?: string }) {
  const [takingLonger, setTakingLonger] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setTakingLonger(true), 12_000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className={`app-loading${contained ? ' app-loading-contained' : ''}`} aria-busy="true">
      <div className="app-loading-content">
        <div className="app-loading-brand"><BrandMark /><span>IELTS Vocab</span></div>
        <div className="app-loading-status" role="status" aria-live="polite" aria-atomic="true">
          <Spinner size="small" label={label} labelPosition="after" />
          <div className="app-loading-feedback">{takingLonger && <p>Kết nối đang chậm. Bạn có thể chờ thêm hoặc tải lại.</p>}</div>
        </div>
        {takingLonger && <Button appearance="outline" onClick={() => window.location.reload()}>Tải lại</Button>}
      </div>
    </div>
  );
}
