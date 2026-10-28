'use client';
import { Button } from '@fluentui/react-components';
import { WarningRegular } from '@fluentui/react-icons/svg/warning';
import { ArrowClockwiseRegular } from '@fluentui/react-icons/svg/arrow-clockwise';
export default function ErrorPage({reset}:{error:Error & {digest?:string};reset:()=>void}) {
  return <div className="error-state" role="alert"><WarningRegular /><h2>Chưa tải được trang</h2><p>Thử tải lại. Dữ liệu đã lưu của bạn vẫn được giữ.</p><Button appearance="primary" icon={<ArrowClockwiseRegular />} onClick={reset}>Thử lại</Button></div>;
}
