import { getRoom, joinRoom } from "@/app/(with-sidebar)/channels/[roomId]/room.action";
import { getUserSession } from "@/app/auth.action";
import { redirect } from "next/navigation";

export default async function JoinRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const user = await getUserSession();

  if (!user) {
    redirect(`/?callbackUrl=/join/${roomId}`);
  }


  // Check if room exists
  const roomResponse = await getRoom(roomId);
  if (!roomResponse.data) {
    redirect("/channels");
  }

  // Join the room if not already a member
  const isMember = roomResponse.data.participants.some(
    (p) => p.user.id === user.user?.id
  );

  if (!isMember && user.user) {
    await joinRoom(roomId, user.user.id);
  }

  // Redirect to the channel
  redirect(`/channels/${roomId}`);
}
