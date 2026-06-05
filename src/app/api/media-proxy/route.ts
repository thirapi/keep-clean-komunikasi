import { NextRequest } from 'next/server';
import { db } from "@/lib/db";
import { HttpSignatureService } from "@/lib/infrastructure/services/http-signature.service";

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');
    if (!url) {
        return new Response('Missing URL', { status: 400 });
    }

    try {
        const targetUrl = new URL(url);
        
        // Basic SSRF Protection
        const hostname = targetUrl.hostname.toLowerCase();
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

        // Handle Range requests from the browser
        const range = request.headers.get('range');

        // --- FEDIVERSE STANDARDIZATION: SIGNED GET ---
        const signingUser = await db.query.users.findFirst({
            where: (users, { isNotNull }) => isNotNull(users.privateKey),
        });

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
        const date = new Date().toUTCString();
        const targetPath = targetUrl.pathname + targetUrl.search;

        const headers: Record<string, string> = {
            "Host": targetUrl.host,
            "Date": date,
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,video/*,*/*;q=0.8",
            "User-Agent": `Mozilla/5.0 (compatible; Komunikasi/1.0; +${baseUrl}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Mastodon/4.2.1`,
            "Referer": `https://${targetUrl.host}/`,
        };

        if (range) {
            headers['Range'] = range;
        }

        if (signingUser && signingUser.privateKey) {
            const signature = HttpSignatureService.sign({
                keyId: `${baseUrl}/api/users/${signingUser.username}#main-key`,
                privateKey: signingUser.privateKey,
                method: "GET",
                target: targetPath,
                headers: headers
            });
            headers["Signature"] = signature;
        }

        const response = await fetch(url, {
            headers: headers,
            next: { revalidate: 31536000 } // Cache heavily
        });

        if (!response.ok && response.status !== 206) {
            // Fallback for some CDNs that might reject signatures
            if (response.status === 401 || response.status === 403) {
                const fallbackHeaders: Record<string, string> = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": headers["Accept"],
                };
                if (range) fallbackHeaders['Range'] = range;

                const plainResponse = await fetch(url, {
                    headers: fallbackHeaders,
                    next: { revalidate: 31536000 }
                });
                if (plainResponse.ok || plainResponse.status === 206) {
                    return await handleProxyResponse(plainResponse);
                }
            }
            return new Response(`Failed to fetch: ${response.statusText}`, { status: response.status });
        }

        return await handleProxyResponse(response);

    } catch (error) {
        console.error('[MediaProxy] Error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

async function handleProxyResponse(response: Response) {
    const contentType = response.headers.get('content-type');
    if (!contentType || (!contentType.startsWith('image/') && !contentType.startsWith('video/') && !contentType.startsWith('application/octet-stream'))) {
        return new Response('Invalid content type', { status: 400 });
    }

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('Access-Control-Allow-Origin', '*');

    // Forward important headers for Range/Partial Content
    const contentRange = response.headers.get('content-range');
    const contentLength = response.headers.get('content-length');
    const acceptRanges = response.headers.get('accept-ranges');

    if (contentRange) headers.set('Content-Range', contentRange);
    if (contentLength) headers.set('Content-Length', contentLength);
    if (acceptRanges) headers.set('Accept-Ranges', acceptRanges);

    // Stream the body instead of blob() to support Range and large files efficiently
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers,
    });
}
