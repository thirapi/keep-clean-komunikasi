import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');
    if (!url) {
        return new Response('Missing URL', { status: 400 });
    }

    try {
        const decodedUrl = decodeURIComponent(url);
        
        // Basic SSRF Protection
        const parsedUrl = new URL(decodedUrl);
        const hostname = parsedUrl.hostname.toLowerCase();
        const isPrivate = 
            hostname === 'localhost' || 
            hostname === '127.0.0.1' || 
            hostname.startsWith('192.168.') || 
            hostname.startsWith('10.') || 
            hostname.startsWith('172.16.') || 
            hostname.endsWith('.local');

        if (isPrivate) {
            return new Response('Forbidden', { status: 403 });
        }

        const response = await fetch(decodedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Komunikasi-Proxy/1.0; +https://komunikasi.qzz.io)',
            },
            // Avoid large files
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            return new Response(`Failed to fetch: ${response.statusText}`, { status: response.status });
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || (!contentType.startsWith('image/') && !contentType.startsWith('video/'))) {
            return new Response('Invalid content type', { status: 400 });
        }

        const blob = await response.blob();
        
        return new Response(blob, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        console.error('[MediaProxy] Error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
