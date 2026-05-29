"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Loader2, UserPlus, Globe } from "lucide-react";
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
      <DialogContent className="sm:max-w-[425px] p-0 gap-0 overflow-hidden bg-background border-border">
        <DialogHeader className="p-4 border-b border-border/50">
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <span>Cari Pengguna</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              className="w-full bg-accent/30 hover:bg-accent/50 focus:bg-accent/70 border-none rounded-xl py-3 pl-10 pr-4 text-sm transition-all outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/50"
              placeholder="Cari username atau handle Fediverse (@user@domain)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-[300px] overflow-y-auto custom-scrollbar px-2 pb-4">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center p-8 gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs font-medium">Mencari di jagat raya...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="flex flex-col gap-1">
              {results.map((user) => (
                <Link
                  key={user.id}
                  href={user.isRemote ? `/profile/${user.id.startsWith("@") ? user.id : user.handle || `@${user.username}`}` : `/profile/${user.username}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 active:bg-accent transition-all group"
                >
                  <UserAvatar src={user.avatar} className="h-10 w-10 ring-1 ring-border group-hover:ring-primary/30 transition-all" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm line-clamp-1">{user.username}</p>
                      {user.isRemote && (
                        <Globe className="h-3 w-3 text-sky-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {user.isRemote ? (user.handle || "Fediverse User") : `@${user.username.toLowerCase()}`}
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <UserPlus className="h-4 w-4 text-primary" />
                  </div>
                </Link>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-8 text-center opacity-40 italic text-sm">
              Tidak ada pengguna yang ditemukan.
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground text-xs font-medium uppercase tracking-widest opacity-30">
              Mulai mengetik untuk mencari
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
