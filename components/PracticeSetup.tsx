'use client';
import PageHeader from '@/components/PageHeader';
import Link from 'next/link';
import { Button, Field, Select, Spinner } from '@fluentui/react-components';
import { ArrowLeftRegular } from '@fluentui/react-icons/svg/arrow-left';
import { ArrowRepeatAllRegular } from '@fluentui/react-icons/svg/arrow-repeat-all';
import { FlashRegular } from '@fluentui/react-icons/svg/flash';
import { GamesRegular } from '@fluentui/react-icons/svg/games';
import { GridRegular } from '@fluentui/react-icons/svg/grid';
import { PlayRegular } from '@fluentui/react-icons/svg/play';
import { TargetArrowRegular } from '@fluentui/react-icons/svg/target-arrow';
import { CheckmarkRegular } from '@fluentui/react-icons/svg/checkmark';
import { TrophyRegular } from '@fluentui/react-icons/svg/trophy';
import { LEVELS } from '@/types';
type Mode = 'review'|'speedrun'|'match'|'sniper'|'blockblast';
const icons={review:ArrowRepeatAllRegular,speedrun:FlashRegular,match:GamesRegular,sniper:TargetArrowRegular,blockblast:GridRegular};
type Props={mode:Mode;title:string;rules:string[];level:string;onLevelChange:(value:string)=>void;onStart:()=>void;exitRoute:string;loading?:boolean;highScore?:number;children?:React.ReactNode};
export default function PracticeSetup({mode,title,rules,level,onLevelChange,onStart,exitRoute,loading,highScore,children}:Props){
  const Icon=icons[mode];
  return <section className="practice-setup">
    <Link href={exitRoute} className="back-link"><ArrowLeftRegular />Quay lại</Link>
    <PageHeader title={title} icon={<Icon />} />
    <div className="practice-setup-columns"><div className="setup-form panel"><h2>Cài đặt</h2><Field label="Cấp độ"><Select size="large" value={level} onChange={e=>onLevelChange(e.target.value)}><option value="all">Tất cả cấp độ</option>{LEVELS.map(value=><option key={value} value={value}>{value}</option>)}</Select></Field>{children}<Button appearance="primary" size="large" icon={loading?<Spinner size="tiny" />:<PlayRegular />} disabled={loading} onClick={onStart}>{loading?'Đang chuẩn bị':'Bắt đầu'}</Button></div>
    <aside className="setup-rules panel"><h2>{mode==='review'?'Cách ôn tập':'Cách chơi'}</h2><ul>{rules.map(rule=><li key={rule}><CheckmarkRegular /><span>{rule}</span></li>)}</ul>{!!highScore&&<div className="setup-record"><TrophyRegular /><span>Kỷ lục</span><strong>{highScore.toLocaleString('vi-VN')}</strong></div>}</aside></div>
  </section>;
}
