'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Button, Spinner, MessageBar } from '@fluentui/react-components';
import { ArrowRepeatAllRegular } from '@fluentui/react-icons/svg/arrow-repeat-all';
import { CheckmarkCircleRegular } from '@fluentui/react-icons/svg/checkmark-circle';

export default function GameResult({ title = 'Hoàn thành lượt chơi', value, label = 'Điểm', onReplay, exitRoute, loading = false, error, replayDisabled = false, busyLabel = 'Đang chuẩn bị', replayLabel='Chơi lại', children, embedded = false }: {
  title?: string; value: number; label?: string; onReplay: () => void; exitRoute: string; loading?: boolean; error?:string; replayDisabled?: boolean; busyLabel?: string; replayLabel?:string; children?: ReactNode; embedded?: boolean;
}) {
  return <section className={`game-result${embedded ? ' game-result-embedded' : ''}`} aria-labelledby="game-result-title">
    <div className="game-result-card panel">
      <span className="game-result-icon"><CheckmarkCircleRegular aria-hidden="true" /></span>
      <h2 id="game-result-title">{title}</h2>
      <div className="game-result-score"><span>{label}</span><strong>{value.toLocaleString('vi-VN')}</strong></div>
      {error && <MessageBar intent="error">{error}</MessageBar>}{children && <div className="game-result-details">{children}</div>}
      <div className="game-result-actions"><Button appearance="primary" size="large" disabled={loading || replayDisabled} onClick={onReplay} icon={loading ? <Spinner size="tiny" /> : <ArrowRepeatAllRegular />}>{loading ? busyLabel : replayLabel}</Button><Link href={exitRoute}>Quay lại</Link></div>
    </div>
  </section>;
}
