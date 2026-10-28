'use client';

import { Skeleton, SkeletonItem } from '@fluentui/react-components';
export default function ContentSkeleton() {
  return <Skeleton className="content-skeleton" aria-label="Đang tải nội dung" animation="pulse">
    <SkeletonItem className="skeleton-heading" /><SkeletonItem className="skeleton-subheading" />
    <div className="metrics-grid">{[0,1,2,3].map(key=><SkeletonItem key={key} className="skeleton-metric" />)}</div>
    <div className="dashboard-columns"><div><SkeletonItem className="skeleton-feature" /><div className="learning-shortcuts"><SkeletonItem className="skeleton-shortcut" /><SkeletonItem className="skeleton-shortcut" /></div></div><SkeletonItem className="skeleton-list" /></div>
  </Skeleton>;
}
