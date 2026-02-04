// src/app/(with-sidebar)/channels/[roomId]/page.tsx
import { getUserSession, sidaBarUserInfo } from "@/app/auth.action";
import { getLastReadAt, getMessage } from "./messages.action";
import { ChatRoom } from "./components/chat-room";
import { getRoom } from "./room.action";
import { AlertTriangle, MessageCircle, MessageSquare } from "lucide-react";
import K from "@/components/icons/k";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  if (roomId === "default") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8 text-center space-y-4 relative">
        {/* Sidebar Trigger - Mobile only */}
        <div className="absolute top-4 left-4 md:hidden z-10">
          <SidebarTrigger />
        </div>

        <div className="flex flex-col items-center space-y-4 animate-fade-in">
          <K className="text-purple-800 dark:text-purple-400 w-24 h-24 animate-bounce" />

          <div className="bg-accent/50 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-sm max-w-lg">
            <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Belum ada channel yang dipilih
            </h2>
            <p className="text-sm text-muted-foreground">
              Silakan pilih channel pada sidebar untuk mulai chat
            </p>
          </div>
        </div>
      </div>
    );
  }

  const session = await getUserSession();
  const [roomResponse, initialMessagesResponse, lastReadAtResponse, userInfo] =
    await Promise.all([
      getRoom(roomId),
      getMessage(roomId, 50),
      getLastReadAt(session?.user?.id ?? "", roomId),
      sidaBarUserInfo(),
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8 text-center space-y-4 relative">
        {/* Sidebar Trigger - Mobile only */}
        <div className="absolute top-4 left-4 md:hidden z-10">
          <SidebarTrigger />
        </div>

        <div className="flex flex-col items-center space-y-4 animate-fade-in">
          <AlertTriangle className="text-red-500 dark:text-red-400 w-20 h-20" />

          <div className="bg-accent/50 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-sm max-w-lg">
            <h1 className="text-xl font-semibold text-foreground mb-2">
              Room Tidak Ditemukan
            </h1>
            <p className="text-sm text-muted-foreground">
              Room yang kamu cari tidak tersedia atau mungkin sudah dihapus.
              Pastikan URL-nya benar atau coba pilih room lain.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full min-h-0">
      <ChatRoom
        userId={session?.user?.id ?? ""}
        roomData={roomData}
        initialMessages={initialMessages ?? []}
        lastReadAt={lastReadAt}
        user={{
          id: session?.user?.id ?? "",
          username: userInfo.name,
          avatar: userInfo.avatar,
        }}
      />
    </div>
  );
}
