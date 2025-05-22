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
    <>
      <SidebarProvider>
        <BreadcrumbProvider>
          <AppSidebar
            user={user}
            checkRole={role}
            groupRooms={groupRooms}
            directRooms={directRooms}
          />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
                <BreadcrumbRenderer />
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min">
                {children}
              </div>
            </div>
          </SidebarInset>
        </BreadcrumbProvider>
      </SidebarProvider>
    </>
  );
}
