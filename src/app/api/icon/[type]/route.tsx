import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
    const { type } = await params; // '192', '512', or 'maskable'
    const size = type === '512' || type === 'maskable' ? 512 : 192;

    // Untuk maskable icon / splash screen pada Android, background harus SOLID (bukan transparan)
    // Ini menghindari masalah "loading menampilkan kotak hitam".
    const isMaskable = type === 'maskable';
    const bgColor = isMaskable ? '#ffffff' : 'transparent';

    // Padding dinamis 22% agar logo tidak terpotong (cramped/mepet) di app drawer HP
    const paddingAmount = size * 0.22;

    // Render SVG native ke dalam image buffer (seperti canvas) on-the-fly
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: bgColor,
                    padding: `${paddingAmount}px`,
                }}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#A855F7"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ width: '100%', height: '100%' }}
                >
                    <path d="M21,16v-8c-.0007-.7138-.3818-1.3731-1-1.73l-7-4c-.6188-.3573-1.3812-.3573-2,0l-7,4C3.3818,6.6269,3.0007,7.2862,3,8v8c.0007.7138.3818,1.3731,1,1.73l7,4c.6188.3573,1.3812.3573,2,0l7-4c.6182-.3569.9993-1.0162,1-1.73Z" />
                    <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                    <line x1="15.505" y1="17.73" x2="15.505" y2="12" />
                    <line x1="18.186" y1="12" x2="15.687" y2="14.865" />
                    <line x1="18.186" y1="15" x2="15.687" y2="14" />
                </svg>
            </div>
        ),
        {
            width: size,
            height: size,
        }
    );
}
