import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'

export const size = {
  width: 512,
  height: 512,
}

export const contentType = 'image/png'
 
export default async function Icon() {
  const frauncesFontData = await fetch(
    'https://fonts.gstatic.com/s/fraunces/v31/6NUh8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0K7iN7hzFUPJH58nBFRg.woff'
  ).then((res) => res.arrayBuffer())

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
              border: '16px solid #1f2937',
              borderRadius: '48px',
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
              border: '16px solid #1f2937',
              borderRadius: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
             <span style={{ fontSize: 130, fontWeight: 900, color: '#1f2937', fontFamily: 'Fraunces', marginTop: -6 }}>V</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Fraunces',
          data: frauncesFontData,
          weight: 900,
          style: 'normal',
        },
      ],
    }
  )
}
