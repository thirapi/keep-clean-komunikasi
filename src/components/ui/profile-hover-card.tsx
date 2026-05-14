import React, { useState, useEffect } from "react";
import { Sparkles, MessageSquare, Loader2 } from "lucide-react";
import Link from "next/link";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPublicProfileAction } from "@/app/(with-sidebar)/user.action";

interface ProfileData {
  id: string;
  username: string;
  avatar: string;
  banner?: string | null;
  bio?: string | null;
  customStatus?: string | null;
}

interface ProfileHoverCardProps {
  user: ProfileData;
  isOnline?: boolean;
  currentUserId: string;
  onStartDM: (userId: string) => void;
  children: React.ReactNode;
}

export function ProfileHoverCard({
  user,
  isOnline,
  currentUserId,
  onStartDM,
  children,
}: ProfileHoverCardProps) {
  const [profile, setProfile] = useState<ProfileData>(user);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchFullProfile = async () => {
    if (hasFetched || isLoading) return;
    setIsLoading(true);
    try {
      const response = await getPublicProfileAction(user.username);
      if (response.status === "success" && response.data) {
        setProfile(response.data);
      }
    } catch (e) {
      console.error("Failed to fetch full profile", e);
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  };

  const ProfileContent = (
    <div className="flex flex-col w-full md:w-72">
      {/* Mini Banner */}
      <div
        className="h-20 w-full bg-muted relative"
        style={{
          background:
            profile.banner && (profile.banner.startsWith("http") || profile.banner.startsWith("/"))
              ? `url(${profile.banner}) center/cover no-repeat`
              : (profile.banner || "linear-gradient(to right, #4f46e5, #7c3aed)"),
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="relative px-4 pb-4 pt-10">
        {/* Overlapping Avatar */}
        <div className="absolute -top-10 left-3">
          <div className="p-1 bg-zinc-950 rounded-xl ring-1 ring-white/10">
            <UserAvatar src={profile.avatar || "/avatars/avatar1.png"} className="h-16 w-16 rounded-lg" />
            <div
              className={cn(
                "absolute bottom-1.5 right-1.5 h-3.5 w-3.5 rounded-full border-2 border-zinc-950 shadow-sm",
                isOnline ? "bg-emerald-500" : "bg-zinc-500"
              )}
            />
          </div>
        </div>

        {/* Info */}
        <div className="space-y-3">
          <div className="flex flex-col">
            <h3 className="text-base font-bold text-white tracking-tight leading-tight">
              {profile.username}
            </h3>
            {profile.customStatus && (
              <div className="flex items-center gap-1.5 mt-1 opacity-80">
                <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                <p className="text-[11px] text-zinc-300 leading-none truncate">{profile.customStatus}</p>
              </div>
            )}
          </div>

          {profile.bio && (
            <p className="text-[11px] text-zinc-400 leading-relaxed italic">{profile.bio}</p>
          )}

          {isLoading && (
            <div className="flex justify-center py-2">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}

          <div className="flex flex-col gap-2 pt-3 border-t border-white/5">
            {profile.id !== currentUserId && (
              <Button
                variant="default"
                size="sm"
                className="w-full gap-2 h-9 text-xs font-bold shadow-lg bg-primary hover:bg-primary/90"
                onClick={() => onStartDM(profile.id)}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Kirim Pesan
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              asChild
              className="w-full h-9 text-xs font-bold bg-white/5 hover:bg-white/10 text-white border-0"
            >
              <Link href={`/profile/${profile.username}`}>Lihat Profil</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: HoverCard */}
      <div className="hidden md:block">
        <HoverCard openDelay={200} onOpenChange={(open) => open && fetchFullProfile()}>
          <HoverCardTrigger asChild>{children}</HoverCardTrigger>
          <HoverCardContent className="w-72 p-0 overflow-hidden border-0 shadow-2xl bg-zinc-950 ring-1 ring-white/10" side="right" align="start">
            {ProfileContent}
          </HoverCardContent>
        </HoverCard>
      </div>

      {/* Mobile: Dialog */}
      <div className="md:hidden">
        <Dialog onOpenChange={(open) => open && fetchFullProfile()}>
          <DialogTrigger asChild>{children}</DialogTrigger>
          <DialogContent className="p-0 w-[90vw] max-w-xs overflow-hidden border-0 shadow-2xl bg-zinc-950 [&>button]:hidden">
            {ProfileContent}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
