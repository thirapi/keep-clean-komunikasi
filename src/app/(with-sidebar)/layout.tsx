import { AppSidebar } from "./app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  getUserSession,
  getUserWithRolesFromSession,
  sidaBarUserInfo,
} from "../auth.action";
import { BreadcrumbProvider } from "@/components/breadcrumb/breadcrumb-context";
import { BreadcrumbRenderer } from "@/components/breadcrumb/breadcrumb-renderer";
import { getRoomsByUserId } from "./channels/[roomId]/room.action";
import { RealtimeNotificationListener } from "@/components/realtime-notification-listener";
import { ModeToggle } from "@/components/landingpage/mode-toggle";

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

  const userRooms = await getRoomsByUserId(userId.user.id);
  const directRooms = (userRooms.data ?? []).filter((room) => room.isDirect);
  const groupRooms = (userRooms.data ?? []).filter((room) => !room.isDirect);

  const session = await sidaBarUserInfo();
  const role = await getUserWithRolesFromSession();

  function getInitials(name: string) {
    if (!name) return "?";
    const nameParts = name.split(" ");
    const initials = nameParts
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
    return initials.length <= 2 ? initials : initials.substring(0, 2);
  }

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
        <RealtimeNotificationListener
          user={{ id: user.id, username: user.name }}
        />
        <BreadcrumbProvider>
          <AppSidebar
            user={user}
            checkRole={role}
            directRooms={directRooms}
            groupRooms={groupRooms}
          />

          <SidebarInset className="flex flex-col flex-1 min-h-0 w-full overflow-hidden">
            {/* Header */}
            <header className="flex h-16 shrink-0 items-center justify-between w-full overflow-hidden px-4">
              <div className="flex items-center gap-2 overflow-hidden min-w-0">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="h-4" />
                <div className="truncate min-w-0">
                  <BreadcrumbRenderer />
                </div>
              </div>
              <ModeToggle />
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
      </SidebarProvider>
    </div>
  );
}
