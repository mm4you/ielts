'use client';

import Link from 'next/link';
import { Button } from '@fluentui/react-components';
import { ArrowRightRegular } from '@fluentui/react-icons/svg/arrow-right';
import { ArrowRepeatAllRegular } from '@fluentui/react-icons/svg/arrow-repeat-all';
import { BookOpenRegular } from '@fluentui/react-icons/svg/book-open';
import { CheckmarkCircleRegular } from '@fluentui/react-icons/svg/checkmark-circle';
import { ChevronRightRegular } from '@fluentui/react-icons/svg/chevron-right';
import { FlashRegular } from '@fluentui/react-icons/svg/flash';
import { GamesRegular } from '@fluentui/react-icons/svg/games';
import { GridRegular } from '@fluentui/react-icons/svg/grid';
import { LibraryRegular } from '@fluentui/react-icons/svg/library';
import { MicRegular } from '@fluentui/react-icons/svg/mic';
import { TargetArrowRegular } from '@fluentui/react-icons/svg/target-arrow';

type DashboardProps = { name: string; totalWords: number; dueWords: number; collectionsCount: number; savedWordsCount: number };
const games = [
  {href:'/speedrun',name:'Tốc chiến',description:'Trả lời nhanh trong 45 giây',icon:FlashRegular},
  {href:'/match',name:'Lật thẻ',description:'Ghép từ với nghĩa tiếng Việt',icon:GamesRegular},
  {href:'/blockblast',name:'Xếp hình',description:'Học từ vựng qua Block Blast',icon:GridRegular},
  {href:'/sniper',name:'Thiện xạ',description:'Chọn đúng từ, luyện phản xạ',icon:TargetArrowRegular},
  {href:'/pronounce-challenge',name:'Phát âm',description:'Luyện phát âm với phản hồi AI',icon:MicRegular},
];

export default function Dashboard({name,totalWords,dueWords,collectionsCount,savedWordsCount}: DashboardProps) {
  const metrics=[
    {label:'Từ trong thư viện',value:totalWords,icon:LibraryRegular,href:'/library'},
    {label:'Thẻ đến hạn',value:dueWords,icon:ArrowRepeatAllRegular,href:'/review'},
    {label:'Bộ sưu tập',value:collectionsCount,icon:BookOpenRegular,href:'/collections'},
    {label:'Từ đã lưu',value:savedWordsCount,icon:CheckmarkCircleRegular,href:'/collections'},
  ];
  return <div className="dashboard">
    <div className="page-heading"><div><h1>Tổng quan</h1><p>{name}</p></div><Button as="a" href="/library" appearance="secondary" icon={<LibraryRegular />}>Thư viện</Button></div>
    <section className="metrics-grid" aria-label="Tổng quan học tập">
      {metrics.map(({label,value,icon:Icon,href})=><Link className="metric" href={href} key={label}><div className="metric-label"><Icon /><span>{label}</span></div><strong>{value.toLocaleString('vi-VN')}</strong><ChevronRightRegular className="metric-arrow" /></Link>)}
    </section>
    <div className="dashboard-columns">
      <div className="dashboard-primary">
        <section className="review-feature" aria-labelledby="review-title">
          <div className="feature-heading"><span className="feature-icon"><ArrowRepeatAllRegular /></span><span>Ôn tập hôm nay</span></div>
          <h2 id="review-title">{dueWords > 0 ? <><strong>{dueWords.toLocaleString('vi-VN')}</strong> thẻ đến hạn</> : 'Sẵn sàng học từ mới'}</h2>
          <p>{dueWords > 0 ? 'Ôn lại những từ đã học bằng flashcard.' : 'Chọn từ mới hoặc luyện lại các thẻ đã học.'}</p>
          <Button as="a" href="/review" appearance="primary" size="large" icon={<ArrowRightRegular />} iconPosition="after">{dueWords > 0 ? 'Bắt đầu ôn tập' : 'Bắt đầu học'}</Button>
          <div className="flashcard-preview" aria-hidden="true"><div className="preview-card-back" /><div className="preview-card"><span>Vocabulary</span><strong>consistent</strong><span>/kənˈsɪstənt/</span><div /><b>nhất quán, đều đặn</b></div></div>
        </section>
        <section className="learning-shortcuts" aria-label="Tài liệu học tập">
          <Link href="/collections" className="shortcut-card"><span className="shortcut-icon"><BookOpenRegular /></span><div><h2>Bộ sưu tập của tôi</h2><p>{collectionsCount} bộ · {savedWordsCount.toLocaleString('vi-VN')} từ đã lưu</p></div><ArrowRightRegular /></Link>
          <Link href="/library" className="shortcut-card"><span className="shortcut-icon"><LibraryRegular /></span><div><h2>Thư viện từ vựng</h2><p>Tìm theo chủ đề và cấp độ A1–C2</p></div><ArrowRightRegular /></Link>
        </section>
      </div>
      <section className="practice-panel" aria-labelledby="practice-title"><div className="section-heading"><h2 id="practice-title">Luyện tập</h2><span>5 chế độ</span></div><div className="practice-list">{games.map(({href,name,description,icon:Icon})=><Link href={href} key={href} className="practice-item"><span className="practice-icon"><Icon /></span><div><h3>{name}</h3><p>{description}</p></div><ChevronRightRegular /></Link>)}</div><Link href="/analytics" className="practice-footer">Xem thống kê học tập<ArrowRightRegular /></Link></section>
    </div>
  </div>;
}
