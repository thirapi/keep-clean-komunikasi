import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { stringToColor } from "@/utils/background-avatar";

export function CurrentAvatar({
  user,
}: {
  user: {
    id: string;
    name: string;
    initial: string;
    role: string;
    email: string;
    avatar: string;
  };
}) {
  const bgColor = stringToColor(user.id);

  return (
    <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
      <div className="relative">
        <Avatar className="w-20 h-20 rounded-lg ring-4 ring-primary/20">
          <AvatarImage
            src={user.avatar || "/placeholder.svg"}
            alt="Current Avatar"
          />
          <AvatarFallback
            className="text-2xl font-bold text-white rounded-lg"
            style={{ backgroundColor: bgColor }}
          >
            {user.initial}
          </AvatarFallback>
        </Avatar>
        {/* <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-card rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div> */}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">{user.name}</h3>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 mt-1">
          {user.role}
        </span>
      </div>
    </div>
  );
}
