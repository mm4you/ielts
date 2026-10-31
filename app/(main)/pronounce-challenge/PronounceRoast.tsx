'use client';
import { useEffect, useRef, useState } from 'react';
import { Badge, Button, MessageBar, Spinner } from '@fluentui/react-components';
import { MicRegular } from '@fluentui/react-icons/svg/mic';
import { StopRegular } from '@fluentui/react-icons/svg/stop';
import { Speaker2Regular } from '@fluentui/react-icons/svg/speaker';
import { ArrowClockwiseRegular } from '@fluentui/react-icons/svg/arrow-clockwise';
import SaveToCollection from '@/app/(main)/collections/SaveToCollection';
import { parseMeaning } from '@/lib/parse';
import { recordingExtension } from '@/lib/pronunciation';

type Props = {wordId:number;wordText:string;ipa?:string|null;meaning?:string|null;example?:string|null;onFinish?:()=>void};
type Phase = 'idle'|'permission'|'recording'|'transcribing'|'checking';
type Result = {score:number;roast:string};
export default function PronounceRoast({wordId,wordText,ipa,meaning,example,onFinish}:Props) {
  const [phase,setPhase]=useState<Phase>('idle');
  const [seconds,setSeconds]=useState(0);
  const [error,setError]=useState('');
  const [transcript,setTranscript]=useState('');
  const [result,setResult]=useState<Result|null>(null);
  const [recordingUrl,setRecordingUrl]=useState('');
  const [supported]=useState(()=>typeof navigator!=='undefined'&&!!navigator.mediaDevices?.getUserMedia&&typeof MediaRecorder!=='undefined');
  const recorder=useRef<MediaRecorder|null>(null);
  const streamRef=useRef<MediaStream|null>(null);
  const lock=useRef(false),alive=useRef(false);
  const timeout=useRef<ReturnType<typeof setTimeout>|null>(null);
  const clock=useRef<ReturnType<typeof setInterval>|null>(null);
  const request=useRef<AbortController|null>(null);
  const urlRef=useRef('');
  const stopTimers=()=>{if(timeout.current)clearTimeout(timeout.current);if(clock.current)clearInterval(clock.current);};
  useEffect(()=>{
    alive.current=true;
    return ()=>{
      alive.current=false;request.current?.abort();stopTimers();
      if(recorder.current){recorder.current.onstop=null;if(recorder.current.state==='recording')recorder.current.stop();}
      streamRef.current?.getTracks().forEach(t=>t.stop());
      if(urlRef.current)URL.revokeObjectURL(urlRef.current);
      window.speechSynthesis?.cancel();
    };
  },[]);
  const listen=(slow=false)=>{
    if(!window.speechSynthesis){setError('Trình duyệt chưa hỗ trợ đọc mẫu. Bạn thử dùng Chrome hoặc Edge nhé.');return;}
    window.speechSynthesis.cancel();
    const speech=new SpeechSynthesisUtterance(wordText);
    speech.lang='en-US';speech.rate=slow?0.7:0.9;
    speech.voice=window.speechSynthesis.getVoices().find(v=>v.lang.replace('_','-')==='en-US')??null;
    speech.onerror=e=>{if(alive.current&&!['canceled','interrupted'].includes(e.error))setError('Chưa phát được giọng mẫu. Bạn thử bấm nghe lại nhé.');};
    window.speechSynthesis.speak(speech);
  };
  const process=async(blob:Blob)=>{
    const controller=new AbortController();request.current=controller;
    const deadline=setTimeout(()=>controller.abort(),45000);
    try {
      setPhase('transcribing');
      const form=new FormData();form.append('file',blob,'recording.'+recordingExtension(blob.type));
      const response=await fetch('/api/transcribe',{method:'POST',body:form,signal:controller.signal});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||'Chưa thể nhận diện bản thu. Bạn thử lại nhé.');
      const text=typeof data.text==='string'?data.text.trim():'';
      if(!text)throw new Error('Chưa nghe rõ giọng của bạn. Hãy đưa micro gần hơn và thử lại.');
      if(!alive.current)return;
      setTranscript(text);setPhase('checking');
      const checked=await fetch('/api/word/'+wordId+'/pronounce-roast',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({transcribedText:text}),signal:controller.signal});
      const feedback=await checked.json();
      if(!checked.ok)throw new Error(feedback.error||'Chưa thể đối chiếu từ.');
      if(alive.current){setResult(feedback);onFinish?.();}
    } catch(e) {
      if(alive.current)setError(e instanceof Error&&e.name!=='AbortError'?e.message:'Nhận diện mất nhiều thời gian. Bạn thử thu lại nhé.');
    } finally {clearTimeout(deadline);lock.current=false;if(alive.current)setPhase('idle');}
  };
  const start=async()=>{
    if(lock.current||!supported)return;
    lock.current=true;setPhase('permission');setError('');setResult(null);setTranscript('');setSeconds(0);
    if(urlRef.current){URL.revokeObjectURL(urlRef.current);urlRef.current='';setRecordingUrl('');}
    window.speechSynthesis?.cancel();
    try {
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      if(!alive.current){stream.getTracks().forEach(t=>t.stop());return;}
      streamRef.current=stream;
      const mime=['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(type=>MediaRecorder.isTypeSupported(type));
      const media=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);recorder.current=media;
      const chunks:Blob[]=[];
      media.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      media.onstop=()=>{
        stopTimers();stream.getTracks().forEach(t=>t.stop());
        if(!alive.current)return;
        if(!chunks.length){lock.current=false;setPhase('idle');setError('Bản thu chưa có âm thanh. Bạn thử lại nhé.');return;}
        const blob=new Blob(chunks,{type:media.mimeType||mime||'audio/webm'});
        urlRef.current=URL.createObjectURL(blob);setRecordingUrl(urlRef.current);
        void process(blob);
      };
      media.onerror=()=>{
        stopTimers();media.onstop=null;stream.getTracks().forEach(t=>t.stop());lock.current=false;
        if(alive.current){setPhase('idle');setError('Ghi âm bị gián đoạn. Bạn thử lại nhé.');}
      };
      media.start();setPhase('recording');
      clock.current=setInterval(()=>setSeconds(s=>Math.min(10,s+1)),1000);
      timeout.current=setTimeout(()=>{if(media.state==='recording')media.stop();},10000);
    } catch(e) {
      streamRef.current?.getTracks().forEach(t=>t.stop());lock.current=false;
      if(alive.current){setPhase('idle');setError(e instanceof DOMException&&e.name==='NotAllowedError'?'Bạn hãy cho phép dùng micro ở biểu tượng cạnh địa chỉ trang, rồi thử lại.':'Chưa mở được micro. Kiểm tra micro đã kết nối và không bị ứng dụng khác sử dụng nhé.');}
    }
  };
  const busy=phase!=='idle',recording=phase==='recording';
  const parsed=parseMeaning(meaning??'');
  const meaningText=parsed.vi||parsed.en;
  const parts=example?.split(/\/\/\/|\|\|\|/);
  return <section className="pronunciation-recorder" aria-label="Luyện đọc từ">
    <header className="recorder-topline"><Badge appearance="tint" color="brand">Mỗi lần một từ</Badge><SaveToCollection wordId={wordId} wordText={wordText}/></header>
    <div className="pronunciation-workspace">
      <div className="pronunciation-word-card">
        <p className="pronunciation-eyebrow">Hôm nay mình đọc từ này nhé</p>
        <h2 className="recorder-word" lang="en">{wordText}</h2>
        {ipa&&<p className="pronunciation-ipa" lang="en">{ipa}</p>}
        {meaningText&&<p className="pronunciation-meaning">{meaningText}</p>}
        <div className="pronunciation-listen"><Button icon={<Speaker2Regular/>} onClick={()=>listen()} disabled={busy}>Nghe mẫu</Button><Button appearance="subtle" onClick={()=>listen(true)} disabled={busy}>Nghe chậm</Button></div>
        {parts?.[0]&&<details className="pronunciation-example-details"><summary>Ví dụ sử dụng</summary><blockquote className="pronunciation-example"><p lang="en">{parts[0]}</p>{parts[1]&&<small>{parts[1]}</small>}</blockquote></details>}
      </div>
      <div className="pronunciation-record-card">
        <div className={'pronunciation-mic-symbol'+(recording?' is-recording':'')} aria-hidden="true"><MicRegular/></div>
        <h3>{recording?'Mình đang nghe bạn':phase==='permission'?'Cho phép dùng micro':phase==='transcribing'?'Đang nghe lại bản thu':phase==='checking'?'Đang đối chiếu từ':result?'Thử thêm một lần nhé':'Đến lượt bạn đọc'}</h3>
        <p>{recording?'Đọc rõ từ, rồi bấm dừng khi nói xong.':'Nghe mẫu, bấm ghi âm rồi đọc từ bằng giọng tự nhiên của bạn.'}</p>
        <Button appearance="primary" size="large" icon={recording?<StopRegular/>:busy?<Spinner size="tiny"/>:result?<ArrowClockwiseRegular/>:<MicRegular/>} disabled={!supported||(busy&&!recording)} onClick={recording?()=>{if(recorder.current?.state==='recording')recorder.current.stop();}:start}>{recording?'Dừng và kiểm tra':phase==='permission'?'Đang mở micro…':busy?'Đang xử lý…':result||recordingUrl?'Thu lại':'Bắt đầu ghi âm'}</Button>
        <span className="pronunciation-record-hint" role="status">{recording?seconds+' / 10 giây':'Tối đa 10 giây · Bản thu dùng để nhận diện từ'}</span>
        {!supported&&<MessageBar intent="warning">Bạn cần trình duyệt có hỗ trợ micro. Hãy mở trang bằng HTTPS hoặc localhost trong Chrome, Edge hay Safari.</MessageBar>}
      </div>
    </div>
    {error&&<MessageBar intent="error">{error}</MessageBar>}
    {recordingUrl&&<div className="pronunciation-playback"><span>Nghe lại giọng của bạn</span><audio controls src={recordingUrl} aria-label="Bản thu của bạn"/></div>}
    {transcript&&<div className="pronunciation-feedback" aria-live="polite"><div><span>Hệ thống nghe được</span><strong lang="en">{transcript}</strong></div>{result&&<><div className="pronunciation-score"><strong>{result.score}%</strong><span>Khớp với từ mẫu</span></div><p>{result.roast}</p></>}</div>}
    <p className="pronunciation-note">Kết quả cho biết hệ thống có nhận đúng từ bạn đọc hay không. Chưa đánh giá chi tiết từng âm, trọng âm hoặc giọng Anh–Mỹ.</p>
  </section>;
}
