import { ImageResponse } from 'next/og'

export const alt = 'GasUndo live map of restaurants open in Kochi'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          background:
            'radial-gradient(circle at top left, rgba(255, 122, 69, 0.28), transparent 28%), linear-gradient(180deg, #0b1328, #050915)',
          color: '#f8fafc',
          padding: '56px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '32px',
            padding: '42px',
            background:
              'linear-gradient(180deg, rgba(17, 26, 54, 0.92), rgba(8, 13, 27, 0.9))',
            boxShadow: '0 24px 60px rgba(5, 8, 22, 0.32)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              style={{
                display: 'flex',
                alignSelf: 'flex-start',
                borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.12)',
                padding: '12px 18px',
                fontSize: '24px',
                fontWeight: 700,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'rgba(255, 210, 166, 0.92)',
              }}
            >
              GasUndo
            </div>
            <div
              style={{
                fontSize: '66px',
                fontWeight: 800,
                lineHeight: 1.05,
                maxWidth: '820px',
              }}
            >
              Restaurants open in Kochi during the LPG shortage
            </div>
            <div
              style={{
                fontSize: '28px',
                lineHeight: 1.4,
                maxWidth: '860px',
                color: 'rgba(226, 232, 240, 0.82)',
              }}
            >
              Live map of open, limited-menu, and closed restaurants across
              Kochi, Ernakulam, and Kerala.
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '24px',
              color: 'rgba(226, 232, 240, 0.74)',
            }}
          >
            <div>www.gasundo.live</div>
            <div>Kochi | Ernakulam | Kerala</div>
          </div>
        </div>
      </div>
    ),
    size
  )
}
