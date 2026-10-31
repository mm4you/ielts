'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@fluentui/react-components';
import { ArrowMaximizeRegular } from '@fluentui/react-icons/svg/arrow-maximize';
import { ArrowMinimizeRegular } from '@fluentui/react-icons/svg/arrow-minimize';
import { ArrowLeftRegular } from '@fluentui/react-icons/svg/arrow-left';
export default function GameViewport({children,room=false}:{children:React.ReactNode;room?:boolean}){
 const surface=useRef<HTMLDivElement>(null);const [fullscreen,setFullscreen]=useState(false),[notice,setNotice]=useState('');
 useEffect(()=>{const node=surface.current;const sync=()=>setFullscreen(document.fullscreenElement===surface.current);document.addEventListener('fullscreenchange',sync);return()=>{document.removeEventListener('fullscreenchange',sync);if(document.fullscreenElement===node)void document.exitFullscreen().catch(()=>{});};},[]);
 useEffect(()=>{const node=surface.current,viewport=window.visualViewport;const resize=()=>{const height=viewport?.height??window.innerHeight;node?.style.setProperty('--game-viewport-height',height+'px');node?.classList.toggle('is-viewport-short',height<550);};resize();viewport?.addEventListener('resize',resize);window.addEventListener('resize',resize);return()=>{viewport?.removeEventListener('resize',resize);window.removeEventListener('resize',resize);};},[]);
 async function toggle(){try{if(document.fullscreenElement)await document.exitFullscreen();else if(surface.current?.requestFullscreen)await surface.current.requestFullscreen();else setNotice('Màn chơi đã mở rộng hết vùng hiển thị của trình duyệt này.');}catch{setNotice('Màn chơi vẫn mở rộng trong trang. Trình duyệt chưa cho phép ẩn thanh địa chỉ.');}}
 return <div className="game-viewport" ref={surface}><header className="game-viewport-bar"><Button as="a" href={room?'/rooms':'/'} appearance="subtle" icon={<ArrowLeftRegular/>}>{room?'Phòng thi đấu':'Về tổng quan'}</Button><span>IELTS Vocab · {room?'Cùng nhau luyện tập':'Giờ chơi, giờ nhớ từ'}</span><Button appearance="subtle" icon={fullscreen?<ArrowMinimizeRegular/>:<ArrowMaximizeRegular/>} onClick={()=>void toggle()}>{fullscreen?'Thu màn hình':'Toàn màn hình'}</Button></header>{notice&&<p className="game-viewport-notice" role="status">{notice}</p>}<main id="main-content" className="game-viewport-content" tabIndex={-1}>{children}</main></div>;
}
