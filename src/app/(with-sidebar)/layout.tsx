"use server";

import { AppSidebar } from "@/app/(with-sidebar)/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  getUserSession,
  getUserWithRolesFromSession,
  sidaBarUserInfo,
} from "@/app/auth.action";
import { RealtimeNotificationListener } from "@/components/realtime-notification-listener";
import { getSidebarData } from "@/app/(with-sidebar)/channels/[roomId]/room.action";
import { PresenceProvider } from "@/components/presence-provider";
import { UnreadProvider } from "@/components/unread-provider";
import { getInitials } from "@/lib/utils";

export default async function layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getUserSession();
  if (!userId?.user?.id) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground text-center">
          Akses tidak diizinkan. Silakan login terlebih dahulu.
        </p>
      </div>
    );
  }

  const sidebarData = await getSidebarData(userId.user.id);
  const directRooms = sidebarData.data?.directMessages ?? [];
  const groupRooms = sidebarData.data?.channels ?? [];
  const session = await sidaBarUserInfo();

  const role = await getUserWithRolesFromSession();

  const user = {
    id: userId.user.id,
    name: session.name,
    initial: getInitials(session.name),
    role: session.role,
    email: session.email,
    avatar: session.avatar,
    bio: session.bio,
    banner: session.banner,
    customStatus: session.customStatus,
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <SidebarProvider>
        <PresenceProvider userId={user.id}>
          <UnreadProvider>
            <RealtimeNotificationListener
              user={{ id: user.id, username: user.name }}
            />
            <AppSidebar
              user={user}
              checkRole={role}
              directRooms={directRooms}
              groupRooms={groupRooms}
            />

            <SidebarInset className="flex flex-col flex-1 min-h-0 w-full overflow-hidden">
              <main className="flex-1 min-h-0 overflow-hidden w-full">
                <div className="h-full w-full rounded-xl overflow-hidden">
                  <div className="h-full w-full overflow-y-auto">{children}</div>
                </div>
              </main>
            </SidebarInset>
          </UnreadProvider>
        </PresenceProvider>
      </SidebarProvider>
    </div>
  );
}
