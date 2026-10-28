'use client';
import { Spinner } from '@fluentui/react-components';
export default function LoadingState({label='Đang tải'}:{label?:string}) {
  return <div className="inline-loading"><Spinner size="small" label={label} /></div>;
}
