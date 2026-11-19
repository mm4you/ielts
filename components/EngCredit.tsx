import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightRegular } from '@fluentui/react-icons/svg/arrow-right';
import BrandMark from './BrandMark';

export function EngBrandPair() {
  return (
    <span className="eng-brand-pair">
      <span className="eng-brand-ielts"><BrandMark size={30} /> IELTS Vocab</span>
      <span className="eng-brand-cross" aria-hidden="true">×</span>
      <Image className="eng-brand-logo" src="/eng-logo.svg" alt="ENG" width={960} height={424} unoptimized />
    </span>
  );
}

export default function EngCredit({ variant }: { variant: 'full' | 'dashboard' | 'footer' | 'about' }) {
  if (variant === 'footer') {
    return <Link className="eng-credit-footer" href="/about" aria-label="Giới thiệu IELTS Vocab và ENG"><EngBrandPair /></Link>;
  }

  if (variant === 'dashboard') {
    return (
      <Link className="eng-credit-strip" href="/about">
        <EngBrandPair />
        <span className="eng-credit-link">Giới thiệu <ArrowRightRegular aria-hidden="true" /></span>
      </Link>
    );
  }

  return (
    <div className="eng-credit-full">
      <EngBrandPair />
      <p lang="en">A project by a member of the <strong>ENG Executive Board</strong>.</p>
      {variant === 'full' && <Link href="/about">Giới thiệu dự án <ArrowRightRegular aria-hidden="true" /></Link>}
    </div>
  );
}
