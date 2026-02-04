"use client";

import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { stringToColor } from "@/utils/background-avatar";
import { searchUsersAction } from "./user.action";

interface User {
  id: string;
  username: string;
  avatar?: string;
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
          avatar: u.avatar ?? undefined,
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

  const getUserInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mulai Percakapan Langsung</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari pengguna..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Results Area */}
          <div className="min-h-[200px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Mencari pengguna...
                </span>
              </div>
            ) : searchQuery && users.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">
                  Tidak ada pengguna yang cocok
                </p>
              </div>
            ) : users.length > 0 ? (
              <ScrollArea className="h-[200px]">
                <div className="space-y-1">
                  {users.map((user) => (
                    <Button
                      key={user.id}
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 hover:bg-accent"
                      onClick={() => handleUserSelect(user.id)}
                    >
                      <Avatar className="h-8 w-8 mr-3 rounded-lg ring-4 ring-primary/20">
                        <AvatarImage
                          src={user.avatar || "/placeholder.svg"}
                          alt={user.username}
                        />
                        <AvatarFallback
                          className="text-xs text-white rounded-lg"
                          style={{ backgroundColor: stringToColor(user.id) }}
                        >
                          {getUserInitials(user.username)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {user.username}
                      </span>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">
                  Ketik untuk mencari pengguna
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
