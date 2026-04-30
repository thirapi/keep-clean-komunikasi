"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

interface UnreadContextType {
  unreadRooms: Record<string, boolean>;
  markAsRead: (roomId: string) => void;
  markAsUnread: (roomId: string) => void;
  initializeUnread: (rooms: { id: string; hasUnread: boolean }[]) => void;
}

const UnreadContext = createContext<UnreadContextType | undefined>(undefined);

export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const [unreadRooms, setUnreadRooms] = useState<Record<string, boolean>>({});

  const initializeUnread = useCallback((rooms: { id: string; hasUnread: boolean }[]) => {
    const initial = rooms.reduce((acc, room) => {
      acc[room.id] = room.hasUnread;
      return acc;
    }, {} as Record<string, boolean>);
    setUnreadRooms(initial);
  }, []);

  const markAsRead = useCallback((roomId: string) => {
    setUnreadRooms((prev) => ({ ...prev, [roomId]: false }));
  }, []);

  const markAsUnread = useCallback((roomId: string) => {
    setUnreadRooms((prev) => ({ ...prev, [roomId]: true }));
  }, []);

  return (
    <UnreadContext.Provider value={{ unreadRooms, markAsRead, markAsUnread, initializeUnread }}>
      {children}
    </UnreadContext.Provider>
  );
}

export function useUnread() {
  const context = useContext(UnreadContext);
  if (!context) {
    throw new Error("useUnread must be used within an UnreadProvider");
  }
  return context;
}
