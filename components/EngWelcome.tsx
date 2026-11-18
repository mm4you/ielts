'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle,
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
          <DialogTitle action={<Button className={styles.close} appearance="subtle" aria-label="Đóng banner" icon={<DismissRegular />} onClick={close} />}>
            <EngBrandPair />
          </DialogTitle>
          <DialogContent className={styles.content}>
            <div className={styles.art}>
              <Image src="/about-study.webp" alt="" fill sizes="(max-width: 600px) 85vw, 476px" />
            </div>
            <p lang="en">A project by a member of the <strong>ENG Executive Board</strong>.</p>
            <p>Làm quen với ENG, câu lạc bộ học thuật tiếng Anh nơi mọi người kết nối, chia sẻ và cùng thực hành.</p>
          </DialogContent>
          <DialogActions className={styles.actions}>
            <Link className="btn-primary" href="/about#eng" onClick={close}>Khám phá ENG <ArrowRightRegular aria-hidden="true" /></Link>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
