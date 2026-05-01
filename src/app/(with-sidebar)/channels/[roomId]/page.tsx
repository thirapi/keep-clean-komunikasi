import { SidebarTrigger } from "@/components/ui/sidebar";
import { MessageSquare, Hash } from "lucide-react";
import K from "@/components/icons/k";
import { ChatRoomClientWrapper } from "@/app/(with-sidebar)/channels/[roomId]/components/chat-room-client-wrapper";
import { getUserSession } from "@/app/auth.action";
import { AnimatedUsername } from "@/components/landingpage/animated-username";
import Link from "next/link";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const session = await getUserSession();
  const username = session?.user?.username || "Pengguna";

  if (roomId === "default") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-background relative px-6">
        <div className="absolute top-4 left-4 z-10">
          <SidebarTrigger />
        </div>

        <div className="relative z-10 text-center space-y-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 via-primary/20 to-blue-500/20 blur-3xl animate-[spin_12s_linear_infinite]" />
            <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl" />
            <K className="w-24 h-24 mx-auto text-primary relative z-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Selamat datang 👋{" "}
              <span className="font-bold text-primary">
                <AnimatedUsername username={username} />
              </span>
            </h2>
            <p className="text-muted-foreground text-base">
              Pilih channel di sidebar untuk memulai
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground/70">
            <span>Atau</span>
            <Link
              href={"/channels/general-channel"}
              className="text-primary hover:underline font-medium"
            >
              masuk ke #general
            </Link>
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
