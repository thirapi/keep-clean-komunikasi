// src/app/(with-sidebar)/channels/[roomId]/page.tsx
import { getUserSession } from "@/app/auth.action";
import { getLastReadAt, getMessage } from "./messages.action";
import { ChatRoom } from "./components/chat-room";
import { getRoom } from "./room.action";
import { AlertTriangle, MessageCircle, MessageSquare } from "lucide-react";

export default async function ChatPage({
  params,
}: {
  params: { roomId: string };
}) {
  const { roomId } = await params;

  if (roomId === "default") {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center space-y-2">
        <MessageSquare className="text-purple-800 w-20 h-20" />
        <h1 className="text-2xl font-semibold text-gray-400">Pilih Channel</h1>
        <p className="text-muted-foreground max-w-md">
          Belum ada channel yang dipilih. Silakan pilih channel pada sidebar
          untuk mulai chat.
        </p>
      </div>
    );
  }

  const session = await getUserSession();
  const [roomResponse, initialMessagesResponse, lastReadAtResponse] =
    await Promise.all([
      getRoom(roomId),
      getMessage(roomId),
      getLastReadAt(session?.user?.id ?? "", roomId),
    ]);

  const roomData = roomResponse.status === "success" ? roomResponse.data : null;
  const initialMessages =
    initialMessagesResponse.status === "success"
      ? initialMessagesResponse.data
      : [];
  const lastReadAt =
    lastReadAtResponse.status === "success" ? lastReadAtResponse.data : null;

  if (!roomData) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center space-y-4">
        <AlertTriangle className="text-red-500 w-16 h-16" />
        <h1 className="text-2xl font-semibold">Room Tidak Ditemukan</h1>
        <p className="text-muted-foreground max-w-md">
          Room yang kamu cari tidak tersedia atau mungkin sudah dihapus.
          Pastikan URL-nya benar atau coba pilih room lain.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <ChatRoom
        userId={session?.user?.id ?? ""}
        roomData={roomData}
        initialMessages={initialMessages ?? []}
        lastReadAt={lastReadAt}
      />
    </div>
  );
}
