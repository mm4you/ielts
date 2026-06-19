import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'

export const size = {
  width: 512,
  height: 512,
}

export const contentType = 'image/png'
 
export default async function Icon() {
  // Fetch Fraunces Black (900) font to match header
  const fontRes = await fetch(
    'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,900&display=swap',
    { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
  )
  const css = await fontRes.text()
  const fontUrlMatch = css.match(/url\(([^)]+\.woff2)\)/)
  
  let fonts: { name: string; data: ArrayBuffer; weight: 900; style: 'normal' }[] = []
  if (fontUrlMatch) {
    const fontData = await fetch(fontUrlMatch[1]).then((r) => r.arrayBuffer())
    fonts = [{ name: 'Fraunces', data: fontData, weight: 900, style: 'normal' }]
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fffaf0',
        }}
      >
        <div style={{ position: 'relative', width: 340, height: 340, display: 'flex' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 230,
              height: 230,
              background: '#0ea5e9',
              border: '24px solid #1f2937',
              borderRadius: '40px',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 230,
              height: 230,
              background: '#f59e0b',
              border: '24px solid #1f2937',
              borderRadius: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
             <span style={{ fontSize: 110, fontWeight: 900, color: '#1f2937', fontFamily: fonts.length ? 'Fraunces' : 'Georgia, serif', marginTop: -4 }}>V</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts,
    }
  )
}
