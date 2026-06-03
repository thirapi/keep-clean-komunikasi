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

        // --- FEDIVERSE STANDARDIZATION: SIGNED GET ---
        // To support instances with "Authorized Fetch" (Secure Mode), 
        // we must sign our request using a local actor's private key.
        
        // 1. Get a system-level or active local user for signing
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
            // FEDIVERSE STANDARDIZATION: Use a compatible User-Agent that identifies our instance
            "User-Agent": `Mozilla/5.0 (compatible; Komunikasi/1.0; +${baseUrl}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Mastodon/4.2.1`,
            // Bypassing hotlinking protection: Set Referer to the target domain or remove it
            "Referer": `https://${targetUrl.host}/`,
        };

        // 2. Add HTTP Signature if we have a signing key
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
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            // Fallback for some CDNs that might reject signatures: try a plain fetch
            if (response.status === 401 || response.status === 403) {
                const plainResponse = await fetch(url, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                        "Accept": headers["Accept"],
                    },
                    next: { revalidate: 3600 }
                });
                if (plainResponse.ok) {
                    return await handleSuccessfulResponse(plainResponse);
                }
            }
            return new Response(`Failed to fetch: ${response.statusText}`, { status: response.status });
        }

        return await handleSuccessfulResponse(response);

    } catch (error) {
        console.error('[MediaProxy] Error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

async function handleSuccessfulResponse(response: Response) {
    const contentType = response.headers.get('content-type');
    if (!contentType || (!contentType.startsWith('image/') && !contentType.startsWith('video/') && !contentType.startsWith('application/octet-stream'))) {
        // Return 400 for non-media types to prevent using proxy for unauthorized file hosting
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
}
