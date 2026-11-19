'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Button, Dialog, DialogBody, DialogContent, DialogSurface, DialogTitle,
} from '@fluentui/react-components';
import { ArrowRightRegular } from '@fluentui/react-icons/svg/arrow-right';
import { DismissRegular } from '@fluentui/react-icons/svg/dismiss';
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
          <DialogTitle className={styles.title} action={<Button className={styles.close} appearance="subtle" aria-label="Đóng banner" icon={<DismissRegular />} onClick={close} />}>
            Cùng học tiếng Anh với ENG
          </DialogTitle>
          <DialogContent className={styles.content}>
            <div className={styles.intro}>
              <p>ENG là câu lạc bộ học thuật tiếng Anh, nơi mọi người chia sẻ cách học và thực hành cùng nhau.</p>
              <Link className="btn-brutal" href="/about#eng" onClick={close}>
                Khám phá ENG <ArrowRightRegular aria-hidden="true" />
              </Link>
            </div>
            <div className={styles.credit}>
              <EngBrandPair />
              <p lang="en">A project by a member of the <strong>ENG Executive Board</strong>.</p>
            </div>
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
