"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchUsersAction } from "./user.action";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface SearchUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function SearchUserDialog({
  open,
  onOpenChange,
  userId,
}: SearchUserDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await searchUsersAction(query);
        if (response.status === "success") {
          setResults(response.data);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectUser = (user: any) => {
    const profileUrl = user.isRemote 
      ? `/profile/${encodeURIComponent(user.handle)}` 
      : `/profile/${encodeURIComponent(user.username)}`;
    router.push(profileUrl);
    onOpenChange(false);
    setQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Cari Pengguna
          </DialogTitle>
          <DialogDescription>
            Cari pengguna lokal atau handle Fediverse (@user@domain)
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Username atau @user@domain.com"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
        </div>

        <ScrollArea className="max-h-[300px]">
          <div className="p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-1">
                {results.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left group"
                  >
                    <UserAvatar src={user.avatar} className="h-10 w-10 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{user.username}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.isRemote ? user.handle : `@${user.username.toLowerCase()}`}
                      </p>
                    </div>
                    {user.isRemote && (
                      <span className="text-[10px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                        Fediverse
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : query.length >= 2 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Tidak ada pengguna ditemukan
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Ketik minimal 2 karakter untuk mencari
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
