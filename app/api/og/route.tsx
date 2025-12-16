import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || 'KOKOMO House'
  const description = searchParams.get('description') || ''

  // Logo laden
  const logoUrl = new URL('/static/images/kokomo-bildmarke.svg', request.url).toString()

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #5eead4 0%, #a7f3d0 30%, #bef264 70%, #d9f99d 100%)',
          padding: 60,
          fontFamily: 'sans-serif',
        }}
      >
        {/* Logo/Site Name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 40,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} width={50} height={50} alt="KOKOMO" style={{ marginRight: 16 }} />
          <div
            style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: '#0f172a',
            }}
          >
            KOKOMO House
          </div>
        </div>

        {/* Title Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            borderRadius: 24,
            padding: '40px 50px',
            justifyContent: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div
            style={{
              fontSize: 52,
              fontWeight: 'bold',
              color: '#0f172a',
              lineHeight: 1.2,
            }}
          >
            {title}
          </div>
          {description && (
            <div
              style={{
                marginTop: 24,
                fontSize: 22,
                color: '#64748b',
                lineHeight: 1.4,
              }}
            >
              {description.length > 150 ? description.substring(0, 150) + '...' : description}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 30,
          }}
        >
          <div
            style={{
              fontSize: 20,
              color: '#334155',
              backgroundColor: 'rgba(255,255,255,0.6)',
              padding: '10px 20px',
              borderRadius: 30,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            www.kokomo.house
          </div>
          <div
            style={{
              fontSize: 18,
              color: '#0369a1',
              backgroundColor: 'rgba(14, 165, 233, 0.15)',
              padding: '10px 20px',
              borderRadius: 30,
            }}
          >
            Tiny House Blog
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
