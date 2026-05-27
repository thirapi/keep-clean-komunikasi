import { NextResponse } from "next/server";
import { getActorOutboxController } from "@/lib/interface-adapters/controllers/users/get-actor-outbox.controller";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ username: string }> }
) {
    const { username } = await params;

    try {
        const outbox = await getActorOutboxController(username);

        if (!outbox) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(outbox, {
            headers: {
                "Content-Type": "application/activity+json"
            }
        });
    } catch (error) {
        console.error("Outbox fetch failed:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
