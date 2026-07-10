import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get("url");
    if (!url) {
        return new NextResponse("Missing url parameter", { status: 400 });
    }

    try {
        const decodedUrl = decodeURIComponent(url);
        const response = await fetch(decodedUrl, {
            headers: {
                "User-Agent": "Komunikasi/1.0",
            },
        });

        if (!response.ok) {
            return new NextResponse("Failed to fetch image", { status: response.status });
        }

        const contentType = response.headers.get("content-type") || "image/webp";
        const buffer = await response.arrayBuffer();

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch {
        return new NextResponse("Failed to fetch image", { status: 500 });
    }
}
