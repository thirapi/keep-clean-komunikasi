// src/components/presence-provider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { pusher } from "@/lib/pusher/pusher.client";
import {
  updatePresenceAction,
  getOnlineUsersAction,
} from "@/app/(with-sidebar)/presence.action";

interface PresenceContextType {
  onlineUserIds: string[];
}

const PresenceContext = createContext<PresenceContextType>({
  onlineUserIds: [],
});

export const usePresence = () => useContext(PresenceContext);

export function PresenceProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string;
}) {
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) return;

    // Fetch initial online users
    const fetchInitialPresence = async () => {
      const response = await getOnlineUsersAction();
      if (response.status === "success" && response.data) {
        setOnlineUserIds(response.data);
      }
    };

    fetchInitialPresence();

    // Heartbeat
    const sendHeartbeat = () => {
      updatePresenceAction(userId, "online");
    };

    sendHeartbeat(); // Initial heartbeat
    const interval = setInterval(sendHeartbeat, 50000); // Every 50 seconds

    // Listen to global presence
    const channel = pusher.subscribe("global-presence");

    channel.bind("user-online", ({ userId: onlineId }: { userId: string }) => {
      setOnlineUserIds((prev) =>
        prev.includes(onlineId) ? prev : [...prev, onlineId],
      );
    });

    channel.bind(
      "user-offline",
      ({ userId: offlineId }: { userId: string }) => {
        setOnlineUserIds((prev) => prev.filter((id) => id !== offlineId));
      },
    );

    // Handle tab closing / logout
    const handleBeforeUnload = () => {
      updatePresenceAction(userId, "offline");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      pusher.unsubscribe("global-presence");
      window.removeEventListener("beforeunload", handleBeforeUnload);
      updatePresenceAction(userId, "offline");
    };
  }, [userId]);

  return (
    <PresenceContext.Provider value={{ onlineUserIds }}>
      {children}
    </PresenceContext.Provider>
  );
}
