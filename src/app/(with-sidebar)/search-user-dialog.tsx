"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MagnifyingGlass, CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { searchUsersAction } from "./user.action";
import { UserAvatar } from "@/components/ui/user-avatar";
import Link from "next/link";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

export function SearchUserDialog({ open, onOpenChange }: SearchUserDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      try {
        const res = await searchUsersAction(debouncedQuery);
        if (res.status === "success") {
          setResults(res.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 gap-0 overflow-hidden bg-background rounded-2xl border-border/40">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            cari pengguna
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 py-2">
          <div className="relative group">
            <MagnifyingGlass weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary/60" />
            <input
              className="w-full bg-muted/30 hover:bg-muted/40 focus:bg-muted/50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm transition-all outline-none ring-1 ring-border/50 focus:ring-2 focus:ring-primary/20"
              placeholder="cari username atau handle fediverse..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-[350px] overflow-y-auto custom-scrollbar px-3 pb-4 mt-2">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <CircleNotch weight="duotone" className="h-7 w-7 animate-spin text-primary/60" />
              <p className="text-sm font-medium">mencari pengguna...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="flex flex-col gap-1">
              {results.map((user) => (
                <Link key={user.id}
                  href={user.isRemote ? `/profile/${user.id.startsWith("@") ? user.id : user.handle || `@${user.username}`}` : `/profile/${user.username}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/40 active:bg-accent/60 transition-all group"
                >
                  <UserAvatar src={user.avatar} className="h-10 w-10 border border-border/50 transition-all" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm line-clamp-1">{user.username}</p>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {user.isRemote ? (user.handle || "pengguna fediverse") : `@${user.username.toLowerCase()}`}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="py-20 text-center text-muted-foreground/60 italic text-sm">
              tidak ada pengguna yang ditemukan.
            </div>
          ) : (
            <div className="py-20 text-center text-muted-foreground/40 text-sm font-medium">
              mulai mengetik untuk mencari
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
