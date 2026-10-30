'use client';
import ChoiceSelect from '@/components/ChoiceSelect';
import PageHeader from '@/components/PageHeader';
import Link from 'next/link';
import { Button, Field, Spinner, MessageBar } from '@fluentui/react-components';
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
import { WeatherRainRegular } from '@fluentui/react-icons/svg/weather-rain';
import { HeadphonesRegular } from '@fluentui/react-icons/svg/headphones';
import { LinkRegular } from '@fluentui/react-icons/svg/link';
import { TextDescriptionRegular } from '@fluentui/react-icons/svg/text-description';
import { TextProofingToolsRegular } from '@fluentui/react-icons/svg/text-proofing-tools';
import { KeyboardRegular } from '@fluentui/react-icons/svg/keyboard';
type Mode = 'review'|'speedrun'|'match'|'sniper'|'blockblast'|'typing'|'spelling-bee'|'word-rain'|'collocations'|'context'|'spelling-hunt';
const icons={review:ArrowRepeatAllRegular,speedrun:FlashRegular,match:GamesRegular,sniper:TargetArrowRegular,blockblast:GridRegular,typing:KeyboardRegular,'spelling-bee':HeadphonesRegular,'word-rain':WeatherRainRegular,collocations:LinkRegular,context:TextDescriptionRegular,'spelling-hunt':TextProofingToolsRegular};
type Props={mode:Mode;title:string;rules:string[];level:string;onLevelChange:(value:string)=>void;onStart:()=>void;exitRoute:string;hideLevel?:boolean;loading?:boolean;error?:string;highScore?:number;children?:React.ReactNode};
export default function PracticeSetup({mode,title,rules,level,onLevelChange,onStart,exitRoute,hideLevel,loading,error,highScore,children}:Props){
  const Icon=icons[mode];
  return <section className="practice-setup">
    <Link href={exitRoute} className="back-link"><ArrowLeftRegular />Quay lại</Link>
    <PageHeader title={title} icon={<Icon />} />
    {error && <MessageBar intent="error">{error}</MessageBar>}<div className="practice-setup-columns"><div className="setup-form panel"><h2>Chuẩn bị một chút</h2>{!hideLevel && <Field label="Cấp độ"><ChoiceSelect size="large" value={level} onChange={e=>onLevelChange(e.target.value)}><option value="all">Tất cả cấp độ</option>{LEVELS.map(value=><option key={value} value={value}>{value}</option>)}</ChoiceSelect></Field>}{children}<Button appearance="primary" size="large" icon={loading?<Spinner size="tiny" />:<PlayRegular />} disabled={loading} onClick={onStart}>{loading?'Đang chuẩn bị':'Bắt đầu'}</Button></div>
    <aside className="setup-rules panel"><h2>{mode==='review'?'Cách ôn tập':'Cách chơi'}</h2><ul>{rules.map(rule=><li key={rule}><CheckmarkRegular /><span>{rule}</span></li>)}</ul>{!!highScore&&<div className="setup-record"><TrophyRegular /><span>Kỷ lục</span><strong>{highScore.toLocaleString('vi-VN')}</strong></div>}</aside></div>
  </section>;
}
