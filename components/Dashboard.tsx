'use client';

import ContinueLearning from './ContinueLearning';
import PageHeader from '@/components/PageHeader';
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
import { PeopleTeamRegular } from '@fluentui/react-icons/svg/people-team';
import { WeatherRainRegular } from '@fluentui/react-icons/svg/weather-rain';
import { HeadphonesRegular } from '@fluentui/react-icons/svg/headphones';
import { LinkRegular } from '@fluentui/react-icons/svg/link';
import { TextDescriptionRegular } from '@fluentui/react-icons/svg/text-description';
import { TextProofingToolsRegular } from '@fluentui/react-icons/svg/text-proofing-tools';
import { KeyboardRegular } from '@fluentui/react-icons/svg/keyboard';

type DashboardProps = { name: string; totalWords: number; dueWords: number; collectionsCount: number; savedWordsCount: number };
const games = [
  {href:'/rooms',name:'Phòng thi đấu',description:'Thi từ vựng cùng bạn bè',icon:PeopleTeamRegular},
  {href:'/speedrun',name:'Tốc chiến',description:'Trả lời nhanh trong 45 giây',icon:FlashRegular},
  {href:'/match',name:'Lật thẻ',description:'Ghép từ với nghĩa tiếng Việt',icon:GamesRegular},
  {href:'/blockblast',name:'Xếp hình',description:'Học từ vựng qua Block Blast',icon:GridRegular},
  {href:'/sniper',name:'Thiện xạ',description:'Chọn đúng từ, luyện phản xạ',icon:TargetArrowRegular},
  {href:'/word-rain',name:'Mưa Từ Vựng',description:'Nhìn nghĩa, tự nhớ từ tiếng Anh',icon:WeatherRainRegular},
  {href:'/spelling-bee',name:'Ong Chính Tả',description:'Nghe phát âm và luyện chính tả',icon:HeadphonesRegular},
  {href:'/collocations',name:'Ghép cụm từ',description:'Tìm những từ thường đi cùng nhau',icon:LinkRegular},
  {href:'/context-practice',name:'Điền từ theo ngữ cảnh',description:'Hiểu câu chuyện, chọn đúng từ',icon:TextDescriptionRegular},
  {href:'/spelling-hunt',name:'Săn lỗi chính tả',description:'Tìm một từ viết sai và sửa lại',icon:TextProofingToolsRegular},
  {href:'/typing',name:'Chíu chíu luyện gõ',description:'Gõ đúng từ để bắn mục tiêu',icon:KeyboardRegular},
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
    <PageHeader title="Góc học của bạn" description={"Chào " + name + ", hôm nay mình học một chút nhé."} actions={<Button as="a" href="/library" appearance="secondary" icon={<LibraryRegular />}>Thư viện</Button>} />
    <section className="metrics-grid" aria-label="Tổng quan học tập">
      {metrics.map(({label,value,icon:Icon,href})=><Link className="metric" href={href} key={label}><div className="metric-label"><Icon /><span>{label}</span></div><strong>{value.toLocaleString('vi-VN')}</strong><ChevronRightRegular className="metric-arrow" /></Link>)}
    </section>
    <ContinueLearning /><div className="dashboard-columns">
      <div className="dashboard-primary">
        <section className="review-feature" aria-labelledby="review-title">
          <div className="feature-heading"><span className="feature-icon"><ArrowRepeatAllRegular /></span><span>Ôn tập hôm nay</span></div>
          <h2 id="review-title">{dueWords > 0 ? <><strong>{dueWords.toLocaleString('vi-VN')}</strong> thẻ đến hạn</> : 'Hôm nay mình học gì?'}</h2>
          <p>{dueWords > 0 ? 'Ôn lại những từ đã học bằng flashcard.' : 'Chọn một chủ đề bạn thích. Mỗi chặng chỉ vài phút để làm quen và nhớ thêm từ mới.'}</p>
          <Button as="a" href={dueWords > 0 ? "/review?source=due" : "/decks"} appearance="secondary" size="large" icon={<ArrowRightRegular />} iconPosition="after">{dueWords > 0 ? 'Bắt đầu ôn tập' : 'Chọn bộ từ đầu tiên'}</Button>
          <div className="flashcard-preview" aria-hidden="true"><div className="preview-card-back" /><div className="preview-card"><span>Vocabulary</span><strong>consistent</strong><span>/kənˈsɪstənt/</span><div /><b>nhất quán, đều đặn</b></div></div>
        </section>
        <section className="learning-shortcuts" aria-label="Góc khám phá">
          <Link href="/collections" className="shortcut-card"><span className="shortcut-icon"><BookOpenRegular /></span><div><h2>Bộ sưu tập của tôi</h2><p>{collectionsCount} bộ · {savedWordsCount.toLocaleString('vi-VN')} từ đã lưu</p></div><ArrowRightRegular /></Link>
          <Link href="/library" className="shortcut-card"><span className="shortcut-icon"><LibraryRegular /></span><div><h2>Thư viện từ vựng</h2><p>Tìm theo chủ đề và cấp độ A1–C2</p></div><ArrowRightRegular /></Link>
        </section>
      </div>
      <section className="practice-panel" aria-labelledby="practice-title"><div className="section-heading"><h2 id="practice-title">Chơi mà học</h2><span>{games.length} chế độ</span></div><div className="practice-list">{games.map(({href,name,description,icon:Icon})=><Link href={href} key={href} className="practice-item"><span className="practice-icon"><Icon /></span><div><h3>{name}</h3><p>{description}</p></div><ChevronRightRegular /></Link>)}</div><Link href="/analytics" className="practice-footer">Xem thống kê học tập<ArrowRightRegular /></Link></section>
    </div>
  </div>;
}
