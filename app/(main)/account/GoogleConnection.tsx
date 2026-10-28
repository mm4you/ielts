'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button, MessageBar, Spinner } from '@fluentui/react-components';
export default function GoogleConnection({ email, linked }: { email: string; linked: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <div className="panel" style={{maxWidth:560}}><h2 style={{fontSize:18,fontWeight:600,marginBottom:12}}>Đăng nhập Google</h2><p style={{fontSize:14,lineHeight:1.8,color:'var(--muted)',marginBottom:20}}>{linked ? 'Tài khoản này đã liên kết Google.' : `Liên kết Google ${email} để dùng thêm phương thức đăng nhập này. Hãy chọn đúng email đang hiển thị; dữ liệu học vẫn giữ nguyên.`}</p>{error&&<MessageBar intent="error">{error}</MessageBar>}<Button appearance="primary" disabled={linked||busy} icon={busy?<Spinner size="tiny" />:undefined} onClick={async()=>{setBusy(true);setError('');try{await signIn('google',{callbackUrl:'/account'},{prompt:'select_account',login_hint:email});}catch{setBusy(false);setError('Chưa mở được Google. Vui lòng thử lại.');}}}>{linked?'Đã liên kết':busy?'Đang mở Google':'Liên kết đúng Google này'}</Button></div>;
}
