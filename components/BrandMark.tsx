export default function BrandMark({size=36}:{size?:number}) {
  return <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false" className="brand-symbol">
    <rect x="6" y="6" width="37" height="45" rx="10" transform="rotate(-8 24.5 28.5)" fill="#176CB0" />
    <rect x="21" y="18" width="37" height="43" rx="10" fill="#F0BE55" />
    <path d="M30 30L39.5 49L49 30" stroke="#193B57" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}
