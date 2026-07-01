import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Cohortle — Cohort-Based Learning Infrastructure';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #391D65 0%, #5B2D9E 50%, #7C3FD4 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Logo area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '40px',
          }}
        >
          {/* Simple logo mark */}
          <div
            style={{
              width: '64px',
              height: '64px',
              background: 'white',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#391D65',
            }}
          >
            C
          </div>
          <span
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: 'white',
              letterSpacing: '-1px',
            }}
          >
            Cohortle
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '32px',
            fontWeight: '600',
            color: 'rgba(255,255,255,0.95)',
            textAlign: 'center',
            lineHeight: 1.3,
            maxWidth: '800px',
            marginBottom: '24px',
          }}
        >
          Purpose-built infrastructure for cohort-based learning
        </div>

        {/* Sub-tagline */}
        <div
          style={{
            fontSize: '20px',
            color: 'rgba(255,255,255,0.7)',
            textAlign: 'center',
            maxWidth: '700px',
          }}
        >
          Empower educators and learners with tools designed for collaborative, community-driven education
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            fontSize: '18px',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          cohortle.com
        </div>
      </div>
    ),
    { ...size }
  );
}
