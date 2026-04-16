"use client";

import { useState, useCallback } from "react";
import { UserPlus, Search, Loader2, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { searchInvitableUsers, inviteToChannel } from "../room.action";
import { toast } from "sonner";
import { stringToColor } from "@/utils/background-avatar";
import { useRouter } from "next/navigation";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  roomName: string;
  currentUserId: string;
}

type UserResult = { id: string; username: string; avatar: string | null };

export function InviteMemberDialog({
  open,
  onOpenChange,
  roomId,
  roomName,
  currentUserId,
}: InviteMemberDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [invitingIds, setInvitingIds] = useState<Set<string>>(new Set());
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  const handleSearch = useCallback(async (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await searchInvitableUsers(roomId, value.trim());
      if (response.status === "success") {
        setResults(response.data ?? []);
      }
    } finally {
      setIsSearching(false);
    }
  }, [roomId]);

  const handleInvite = async (user: UserResult) => {
    setInvitingIds((prev) => new Set(prev).add(user.id));
    try {
      const response = await inviteToChannel(roomId, currentUserId, user.id);
      if (response.status === "success") {
        setInvitedIds((prev) => new Set(prev).add(user.id));
        toast.success(`${user.username} berhasil diundang ke #${roomName}`);
        router.refresh();
      } else {
        toast.error(response.error?.message ?? "Gagal mengundang anggota");
      }
    } finally {
      setInvitingIds((prev) => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setQuery("");
      setResults([]);
      setInvitedIds(new Set());
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Undang Anggota
          </DialogTitle>
          <DialogDescription>
            Cari pengguna untuk diundang ke{" "}
            <span className="font-semibold text-foreground">#{roomName}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama pengguna..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Results */}
        <div className="min-h-[140px] space-y-1.5">
          {query.length < 2 && (
            <div className="flex flex-col items-center justify-center h-[140px] text-center text-muted-foreground">
              <Search className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Ketik minimal 2 huruf untuk mencari</p>
            </div>
          )}

          {!isSearching && query.length >= 2 && results.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[140px] text-center text-muted-foreground">
              <X className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Tidak ada pengguna yang ditemukan</p>
              <p className="text-xs">Coba nama yang berbeda</p>
            </div>
          )}

          {results.map((user) => {
            const isInvited = invitedIds.has(user.id);
            const isInviting = invitingIds.has(user.id);

            return (
              <div
                key={user.id}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-9 w-9 rounded-lg shrink-0">
                  <AvatarImage src={user.avatar ?? ""} />
                  <AvatarFallback
                    className="rounded-lg text-white text-xs font-bold"
                    style={{ backgroundColor: stringToColor(user.id) }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{user.username}</p>
                </div>

                {isInvited ? (
                  <Badge
                    variant="secondary"
                    className="gap-1 text-emerald-600 bg-emerald-500/10 border-emerald-500/20 shrink-0"
                  >
                    <Check className="w-3 h-3" />
                    Diundang
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 h-8 text-xs font-semibold shrink-0"
                    onClick={() => handleInvite(user)}
                    disabled={isInviting}
                  >
                    {isInviting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <UserPlus className="w-3 h-3" />
                    )}
                    {isInviting ? "Mengundang..." : "Undang"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
