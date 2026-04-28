// src/app/(with-sidebar)/channels/[roomId]/page.tsx
import { SidebarTrigger } from "@/components/ui/sidebar";
import { MessageSquare } from "lucide-react";
import K from "@/components/icons/k";
import { ChatRoomClientWrapper } from "@/app/(with-sidebar)/channels/[roomId]/components/chat-room-client-wrapper";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  if (roomId === "default") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8 text-center space-y-4 relative">
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

  return (
    <div className="flex flex-col flex-1 h-full min-h-0">
      <ChatRoomClientWrapper roomId={roomId} />
    </div>
  );
}
