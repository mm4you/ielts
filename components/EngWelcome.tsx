'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle,
} from '@fluentui/react-components';
import { ArrowRightRegular } from '@fluentui/react-icons/svg/arrow-right';
import { DismissRegular } from '@fluentui/react-icons/svg/dismiss';
import { engValues } from '@/lib/eng-values';
import { EngBrandPair } from './EngCredit';
import styles from './EngWelcome.module.css';

const sessionKey = 'ielts-vocab:eng-welcome';
let shownInDocument = false;

export default function EngWelcome() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (shownInDocument) return;
      try {
        if (sessionStorage.getItem(sessionKey)) return;
        sessionStorage.setItem(sessionKey, '1');
      } catch {
        // A browser that blocks storage can still show the banner once per document.
      }
      shownInDocument = true;
      setOpen(true);
    }, 450);
    return () => window.clearTimeout(timer);
  }, []);

  const close = () => setOpen(false);

  return (
    <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
      <DialogSurface className={styles.surface}>
        <DialogBody className={styles.body}>
          <DialogTitle action={<Button className={styles.close} appearance="subtle" aria-label="Đóng banner" icon={<DismissRegular />} onClick={close} />}>
            <EngBrandPair />
          </DialogTitle>
          <DialogContent className={styles.content}>
            <div className={styles.poster}>
              <h3>Kết nối qua<br />tiếng Anh</h3>
              <ul lang="en" aria-label="ENG core values">
                {engValues.map(({ name }) => <li key={name}>{name}</li>)}
              </ul>
            </div>
            <p lang="en">A project by a member of the <strong>ENG Executive Board</strong>.</p>
            <p>ENG là câu lạc bộ học thuật tiếng Anh, nơi mọi người chia sẻ cách học và thực hành cùng nhau.</p>
          </DialogContent>
          <DialogActions className={styles.actions}>
            <Link className="btn-primary" href="/about#eng" onClick={close}>Khám phá ENG <ArrowRightRegular aria-hidden="true" /></Link>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
