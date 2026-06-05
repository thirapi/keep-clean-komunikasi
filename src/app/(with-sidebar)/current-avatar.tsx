import { UserAvatar } from "@/components/ui/user-avatar";

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
  return (
    <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
      <div className="relative">
        <UserAvatar 
          src={user.avatar} 
          alt="Current Avatar"
          className="w-20 h-20 rounded-lg ring-4 ring-primary/20"
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">{user.name}</h3>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mt-1">
          {user.role}
        </span>
      </div>
    </div>
  );
}
