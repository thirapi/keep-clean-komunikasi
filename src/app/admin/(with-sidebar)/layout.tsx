import { AppSidebar } from "./app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  getUserSession,
  getUserWithRolesFromSession,
  sidaBarUserInfo,
} from "@/app/auth.action";
import { BreadcrumbProvider } from "@/components/breadcrumb/breadcrumb-context";
import { RealtimeNotificationListener } from "@/components/realtime-notification-listener";
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

  const session = await sidaBarUserInfo();
  const role = await getUserWithRolesFromSession();

  const user = {
    id: userId.user.id,
    name: session.name,
    initial: getInitials(session.name),
    role: session.role,
    email: session.email,
    avatar: session.avatar,
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <SidebarProvider>
        <UnreadProvider>
          <RealtimeNotificationListener
            user={{ id: user.id, username: user.name }}
          />
          <BreadcrumbProvider>
            <AppSidebar
              user={user}
              checkRole={role}
            />

            <SidebarInset className="flex flex-col flex-1 min-h-0 w-full overflow-hidden">
              {/* Header - Mobile only */}
              <header className="flex h-16 shrink-0 items-center gap-2 px-4 md:hidden">
                <SidebarTrigger className="-ml-1" />
              </header>

              {/* Main content */}
              <main className="flex-1 min-h-0 overflow-hidden w-full">
                <div className="h-full w-full rounded-xl overflow-hidden">
                  <div className="h-full w-full overflow-y-auto rounded-xl px-4 pb-4">
                    <div className="h-full w-full max-w-full">{children}</div>
                  </div>
                </div>
              </main>
            </SidebarInset>
          </BreadcrumbProvider>
        </UnreadProvider>
      </SidebarProvider>
    </div>
  );
}
