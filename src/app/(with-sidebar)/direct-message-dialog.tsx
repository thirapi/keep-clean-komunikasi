"use client";

import { useState, useEffect } from "react";
import { MagnifyingGlass, CircleNotch } from "@phosphor-icons/react/dist/ssr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { searchUsersAction } from "./user.action";

interface User {
  id: string;
  username: string;
  avatar: string;
}

type CurrentUser = {
  id: string;
  name: string;
  initial: string;
  role: string;
  email: string;
  avatar: string;
};

interface DirectMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser: (userId: string) => void;
  user: CurrentUser;
}

export function DirectMessageDialog({
  open,
  onOpenChange,
  onSelectUser,
  user,
}: DirectMessageDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchUsers = async (query: string): Promise<User[]> => {
    const response = await searchUsersAction(query);
    if (response.status === "success" && response.data) {
      return response.data
        .filter((u) => u.id !== user.id)
        .map((u) => ({
          id: u.id,
          username: u.username,
          avatar: u.avatar,
        }));
    }
    return [];
  };

  // Handle search with debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await searchUsers(searchQuery);
        setUsers(results);
      } catch (error) {
        console.error("Error searching users:", error);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setUsers([]);
      setIsLoading(false);
    }
  }, [open]);

  const handleUserSelect = (userId: string) => {
    onSelectUser(userId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden rounded-2xl border-border/40 bg-background">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            mulai percakapan
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-2">
          <div className="relative group">
            <MagnifyingGlass weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary/60" />
            <Input
              placeholder="cari pengguna..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-[350px] overflow-hidden flex flex-col mt-2 px-3 pb-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <CircleNotch weight="duotone" className="h-7 w-7 animate-spin text-primary/60" />
              <p className="text-sm font-medium">mencari pengguna...</p>
            </div>
          ) : searchQuery && users.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground/60 italic text-sm">
              tidak ada pengguna yang cocok.
            </div>
          ) : users.length > 0 ? (
            <ScrollArea className="h-full">
              <div className="space-y-1 p-1">
                {users.map((user) => (
                  <Button
                    key={user.id}
                    variant="ghost"
                    className="w-full justify-start h-auto p-3 rounded-xl hover:bg-accent/40 active:bg-accent/60 transition-all border border-transparent hover:border-border/40"
                    onClick={() => handleUserSelect(user.id)}
                  >
                    <UserAvatar 
                      src={user.avatar} 
                      alt={user.username}
                      className="h-10 w-10 border border-border/50 transition-all mr-3"
                    />
                    <span className="text-sm font-bold">
                      {user.username}
                    </span>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="py-20 text-center text-muted-foreground/40 text-sm font-medium">
              ketik untuk mencari pengguna
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
