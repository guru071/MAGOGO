import { ImageResponse } from 'next/og';
import { db } from '@/lib/db';

export const runtime = 'edge';
export const alt = 'MAGHGO AI Prompt';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { id: string } }) {
  try {
    const prompt = await db.prompt.findUnique({
      where: { id: params.id },
      include: { seller: true }
    });

    if (!prompt) {
      return new Response('Not Found', { status: 404 });
    }

    const price = prompt.isFree ? 'FREE' : `$${prompt.price}`;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            backgroundColor: '#0f172a', // slate-900
            padding: '80px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Background decoration */}
          <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, background: '#0066CC', filter: 'blur(100px)', opacity: 0.3, borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: -100, left: -100, width: 400, height: 400, background: '#FF6600', filter: 'blur(100px)', opacity: 0.2, borderRadius: '50%' }} />
          
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
            <div style={{ background: '#FF6600', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: 24, fontWeight: 'bold', marginRight: '16px' }}>MAGHGO</div>
            <div style={{ color: '#94a3b8', fontSize: 24 }}>AI Prompt Marketplace</div>
          </div>

          <div style={{
            fontSize: 64,
            fontWeight: 900,
            color: 'white',
            lineHeight: 1.1,
            marginBottom: '30px',
            maxWidth: '900px'
          }}>
            {prompt.title}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', marginTop: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#94a3b8', fontSize: 24, marginBottom: '8px' }}>By {prompt.seller.name}</span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#10b981',
              color: 'white',
              fontSize: 32,
              fontWeight: 'bold',
              padding: '12px 32px',
              borderRadius: '30px',
              marginLeft: 'auto'
            }}>
              {price}
            </div>
          </div>
        </div>
      ),
      { ...size }
    );
  } catch (e: any) {
    return new Response('Failed to generate image', { status: 500 });
  }
}
