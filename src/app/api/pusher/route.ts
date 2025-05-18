import { NextRequest, NextResponse } from "next/server";
import { authorizePresenceChannelController } from "@/lib/interface-adapters/controllers/messages/authorize-presence-channel.controller";
import { getUserSessionFromRequest } from "@/app/auth.action";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.text();
    const params = new URLSearchParams(formData);

    const socket_id = params.get("socket_id");
    const channel_name = params.get("channel_name");

    if (!socket_id || !channel_name) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const session = await getUserSessionFromRequest(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await authorizePresenceChannelController({
      socketId: socket_id,
      channelName: channel_name,
      userId: session.user.id,
      username: session.user.username,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
