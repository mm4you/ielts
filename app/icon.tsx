import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'

export const size = {
  width: 512,
  height: 512,
}

export const contentType = 'image/png'
 
export default function Icon() {
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
        <div style={{ position: 'relative', width: 360, height: 360, display: 'flex' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 240,
              height: 240,
              background: '#0ea5e9',
              border: '32px solid #111827',
              borderRadius: '64px',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 240,
              height: 240,
              background: '#f59e0b',
              border: '32px solid #111827',
              borderRadius: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
             <span style={{ fontSize: 120, fontWeight: 900, color: '#111827', fontFamily: 'serif', marginTop: -10 }}>V</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
