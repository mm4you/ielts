'use client';
import { Button } from '@fluentui/react-components';
import { DocumentSearchRegular } from '@fluentui/react-icons/svg/document-search';
export default function NotFound(){return <main className="error-state"><DocumentSearchRegular /><h1>Không tìm thấy trang</h1><p>Đường dẫn có thể đã thay đổi hoặc không tồn tại.</p><Button as="a" href="/" appearance="primary">Về trang chủ</Button></main>;}
