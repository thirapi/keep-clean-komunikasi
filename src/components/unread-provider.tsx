"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

interface UnreadRoomState {
  hasUnread: boolean;
  hasMention: boolean;
}

interface UnreadContextType {
  unreadRooms: Record<string, UnreadRoomState>;
  markAsRead: (roomId: string) => void;
  markAsUnread: (roomId: string, hasMention?: boolean) => void;
  initializeUnread: (rooms: { id: string; hasUnread: boolean; hasMention: boolean }[]) => void;
}

const UnreadContext = createContext<UnreadContextType | undefined>(undefined);

export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const [unreadRooms, setUnreadRooms] = useState<Record<string, UnreadRoomState>>({});

  const initializeUnread = useCallback((rooms: { id: string; hasUnread: boolean; hasMention: boolean }[]) => {
    const initial = rooms.reduce((acc, room) => {
      acc[room.id] = { hasUnread: room.hasUnread, hasMention: room.hasMention };
      return acc;
    }, {} as Record<string, UnreadRoomState>);
    setUnreadRooms(initial);
  }, []);

  const markAsRead = useCallback((roomId: string) => {
    setUnreadRooms((prev) => ({ ...prev, [roomId]: { hasUnread: false, hasMention: false } }));
  }, []);

  const markAsUnread = useCallback((roomId: string, hasMention = false) => {
    setUnreadRooms((prev) => {
      const current = prev[roomId] || { hasUnread: false, hasMention: false };
      return {
        ...prev,
        [roomId]: {
          hasUnread: true,
          hasMention: hasMention || current.hasMention
        }
      };
    });
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
