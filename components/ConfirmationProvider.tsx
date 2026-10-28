'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, Field, Input } from '@fluentui/react-components';

type Options = { title: string; description: string; confirmLabel?: string; danger?: boolean };
type Value = boolean | string | null;
type Api = { confirm: (options: Options) => Promise<boolean>; password: (options: Options) => Promise<string | null> };
const ConfirmationContext = createContext<Api | null>(null);
export function useConfirmation() {
  const api = useContext(ConfirmationContext);
  if (!api) throw new Error('ConfirmationProvider is missing');
  return api;
}
export default function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<{ kind: 'confirm' | 'password'; options: Options } | null>(null);
  const [value, setValue] = useState('');
  const resolve = useRef<((value: Value) => void) | null>(null);
  const request = useCallback((kind: 'confirm' | 'password', options: Options) => new Promise<Value>(done => {
    resolve.current?.(null); resolve.current = done; setValue(''); setPending({ kind, options });
  }), []);
  const confirm = useCallback(async (options: Options) => (await request('confirm', options)) === true, [request]);
  const password = useCallback(async (options: Options) => { const result = await request('password', options); return typeof result === 'string' ? result : null; }, [request]);
  function finish(result: Value) { resolve.current?.(result); resolve.current = null; setPending(null); setValue(''); }
  useEffect(() => () => { resolve.current?.(null); }, []);
  return <ConfirmationContext.Provider value={{ confirm, password }}>{children}<Dialog open={!!pending} onOpenChange={(_, data) => { if (!data.open) finish(null); }}><DialogSurface className="confirmation-dialog"><DialogBody><DialogTitle>{pending?.options.title}</DialogTitle><DialogContent><form id="app-confirmation-form" onSubmit={event => { event.preventDefault(); finish(pending?.kind === 'password' ? value : true); }}><p className="confirmation-description">{pending?.options.description}</p>{pending?.kind === 'password' && <Field label="Mật khẩu mới" required hint="Ít nhất 6 ký tự."><Input type="password" autoComplete="new-password" required minLength={6} value={value} onChange={(_, data) => setValue(data.value)} /></Field>}</form></DialogContent><DialogActions><Button onClick={() => finish(null)}>Hủy</Button><Button type="submit" form="app-confirmation-form" appearance="primary" className={pending?.options.danger ? 'danger-action' : undefined} disabled={pending?.kind === 'password' && value.length < 6}>{pending?.options.confirmLabel || 'Xác nhận'}</Button></DialogActions></DialogBody></DialogSurface></Dialog></ConfirmationContext.Provider>;
}
