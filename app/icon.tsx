import { ImageResponse } from 'next/og';
import BrandMark from '@/components/BrandMark';
export const runtime = 'edge';
export const size = {width:512,height:512};
export const contentType = 'image/png';
export default function Icon() {
  return new ImageResponse(<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'#f5f6f8',borderRadius:112}}><BrandMark size={430} /></div>,size);
}
