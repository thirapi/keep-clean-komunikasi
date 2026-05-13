import { NextResponse } from "next/server";
import { LinkPreviewService } from "@/lib/infrastructure/services/link-preview.service";

const linkPreviewService = new LinkPreviewService();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const preview = await linkPreviewService.getPreview(url);
    if (!preview) {
      return NextResponse.json({ error: "Could not fetch preview" }, { status: 404 });
    }
    return NextResponse.json(preview);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
