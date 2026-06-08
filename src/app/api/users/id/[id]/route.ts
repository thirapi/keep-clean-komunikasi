import { NextResponse } from "next/server";
import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { db } from "@/lib/db";
import { GetActorProfileUseCase } from "@/lib/application/use-cases/users/get-actor-profile.use-case";

export const dynamic = "force-dynamic";

/**
 * Stable Actor Profile endpoint (ActivityPub) using ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const accept = request.headers.get("accept") || "";

  // This endpoint is primarily for ActivityPub
  if (!accept.includes("application/activity+json") && !accept.includes("application/ld+json")) {
    const userRepository = new UserRepository(db);
    const user = await userRepository.findById(id);
    if (user) {
      return NextResponse.redirect(new URL(`/profile/${user.username}`, request.url));
    }
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const userRepository = new UserRepository(db);
    const user = await userRepository.findById(id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const getActorProfileUseCase = new GetActorProfileUseCase(userRepository);
    const actor = await getActorProfileUseCase.execute(user.username);

    return NextResponse.json(actor, {
      headers: {
        "Content-Type": "application/activity+json"
      }
    });
  } catch (error) {
    console.error("Actor profile fetch by ID failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
