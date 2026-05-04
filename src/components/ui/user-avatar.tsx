import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src: string;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
}

export function UserAvatar({
  src,
  alt,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  
  return (
    <Avatar className={cn("shrink-0", className)}>
      <AvatarImage src={src} alt={alt} className="object-cover" />
      <AvatarFallback className={cn("bg-muted rounded-md", fallbackClassName)} />
    </Avatar>
  );
}
