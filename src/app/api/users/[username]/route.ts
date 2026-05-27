import { NextResponse } from "next/server";
import { getActorProfileController } from "@/lib/interface-adapters/controllers/users/get-actor-profile.controller";

export const dynamic = "force-dynamic";

/**
 * Actor Profile endpoint (ActivityPub)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  try {
    const actor = await getActorProfileController(username);

    if (!actor) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(actor, {
      headers: {
        "Content-Type": "application/activity+json"
      }
    });
  } catch (error) {
    console.error("Actor profile fetch failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
