"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { debounce } from "lodash";
import { pusher } from "@/lib/pusher/pusher.client";
import { getMessage, updateLastReadAt, editMessageAction, toggleReactionAction } from "../messages.action";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createId } from "@paralleldrive/cuid2";

import { MessageWithUserDTO } from "@/lib/entities/models/message.model";
import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";

import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { ChatHeader } from "./chat-header";
import { MemberList } from "./member-list";
import { MobileMemberList } from "./mobile-member-list";
import { MessageSearch } from "@/components/message-search";
import { useScrollToInitial } from "./hooks/use-scroll-to-initial";
import { useAutoScroll } from "./hooks/use-auto-scroll";
import { useAutoFocusInput } from "./hooks/use-auto-focus-input";
import { useMarkAsRead } from "./hooks/use-mark-as-read";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePresence } from "@/components/presence-provider";
import { useUnread } from "@/components/unread-provider";

interface ChatRoomProps {
  userId: string;
  roomData: RoomWithParticipantsDTO;
  initialMessages: MessageWithUserDTO[];
  lastReadMessageId: string | null;
  lastReadAt: Date | null;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
}

export function ChatRoom({
  userId,
  roomData,
  initialMessages,
  lastReadMessageId,
  lastReadAt,
  user,
}: ChatRoomProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [localRoomData, setLocalRoomData] = useState(roomData);
  const { onlineUserIds } = usePresence();
  const { markAsRead: markSidebarAsRead } = useUnread();
  const [showMembers, setShowMembers] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<MessageWithUserDTO | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [hasMore, setHasMore] = useState(initialMessages.length === 50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastReadIdState, setLastReadIdState] = useState<string | null>(
    lastReadMessageId,
  );
  const [lastReadAtState, setLastReadAtState] = useState<Date | null>(
    lastReadAt,
  );
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);
  const isMobile = useIsMobile();
  const router = useRouter();

  const messagesRef = useRef(messages);
  const lastPersistedReadIdRef = useRef<string | null>(lastReadMessageId);
  const isInitialLoadRef = useRef(true);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const unreadRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  // Sync state with props when they change (e.g. after server fetch in wrapper)
  useEffect(() => {
    // HARDENING: Only sync from props if the incoming data is newer than what we have locally.
    // This prevents stale server responses from overwriting rapid local read-state updates.
    if (lastReadAt) {
      const incomingAt = new Date(lastReadAt);
      if (!lastReadAtState || incomingAt > lastReadAtState) {
        setLastReadIdState(lastReadMessageId);
        setLastReadAtState(incomingAt);
        lastPersistedReadIdRef.current = lastReadMessageId;
      }
    } else if (!lastReadAtState && lastReadMessageId) {
      // Handle case where we have an ID but no timestamp yet (legacy or edge case)
      setLastReadIdState(lastReadMessageId);
      lastPersistedReadIdRef.current = lastReadMessageId;
    }
  }, [lastReadMessageId, lastReadAt]);

  const scrollToMessage = useCallback((messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(messageId);
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 2000);
    } else {
      toast.info("Pesan tidak ditemukan di tampilan saat ini");
    }
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
    import("@/lib/infrastructure/cache/client-cache").then((m) => {
      const persistedMsgs = messages.filter(msg => !msg.isOptimistic);
      m.clientChatCache.setMessages(localRoomData.id, persistedMsgs);
    });
  }, [messages, localRoomData.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const sendNotification = useCallback(
    (msg: MessageWithUserDTO) => {
      try {
        const audio = new Audio("/sounds/message-notification.mp3");
        audio.play().catch((e) => console.warn("Audio play failed", e));
      } catch (e) {
        console.warn("Audio context failed", e);
      }

      const resolveContentForNotification = (raw: string) => {
        return raw.replace(/<@([a-zA-Z0-9_-]+)>/g, (match, uid) => {
          if (uid === "everyone") return "@everyone";
          if (uid === userId) return `@${user.username}`;
          const participant = localRoomData.participants?.find((p: any) => p.user.id === uid);
          return participant ? `@${participant.user.username}` : match;
        });
      };

      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted" &&
        !document.hasFocus()
      ) {
        new Notification(
          `${msg.user?.username ?? "Seseorang"} di #${roomData.name}`,
          {
            body: resolveContentForNotification(msg.content),
            icon: msg.user?.avatar || "/favicon.ico",
            tag: `msg-${roomData.id}`,
            silent: true,
          },
        );
      }
    },
    [roomData.name, roomData.id],
  );

  const markAsReadApi = useMemo(
    () =>
      debounce(async (messageId?: string) => {
        if (!userId || userId === "" || userId === "null") return;

        // If no messageId provided, use the last message in the list
        let targetId = messageId || messagesRef.current[messagesRef.current.length - 1]?.id;

        if (!targetId || targetId === lastPersistedReadIdRef.current)
          return;

        // Find the message index
        let currentIndex = messagesRef.current.findIndex(m => m.id === targetId);
        if (currentIndex === -1) return;

        // HARDENING: If target message is optimistic, we CANNOT send it to server (FK violation)
        // Find the latest REAL message at or before this index
        let targetMsg = messagesRef.current[currentIndex];
        if (targetMsg.isOptimistic || targetId.startsWith('optimistic-')) {
          const lastRealMsgIndex = messagesRef.current.slice(0, currentIndex + 1).findLastIndex(m => !m.isOptimistic && !m.id.startsWith('optimistic-'));
          if (lastRealMsgIndex === -1) return; // No real messages to mark as read yet

          currentIndex = lastRealMsgIndex;
          targetMsg = messagesRef.current[currentIndex];
          targetId = targetMsg.id;

          // Check again if this real message was already persisted
          if (targetId === lastPersistedReadIdRef.current) return;
        }

        const prevIndex = lastPersistedReadIdRef.current
          ? messagesRef.current.findIndex(m => m.id === lastPersistedReadIdRef.current)
          : -1;

        if (prevIndex !== -1 && currentIndex <= prevIndex) return;

        // Find the message's createdAt to use as the precision timestamp
        const targetAt = new Date(targetMsg.createdAt);

        // Update local state and persisted ref
        setLastReadIdState(targetId);
        setLastReadAtState(targetAt);
        lastPersistedReadIdRef.current = targetId;

        // Sync to sidebar and cache
        markSidebarAsRead(roomData.id);
        import("@/lib/infrastructure/cache/client-cache").then((m) => {
          m.clientChatCache.setLastRead(roomData.id, targetId, targetAt);
        });

        // Server update
        updateLastReadAt(userId, roomData.id, targetId, targetAt).catch(err => {
          console.error("Failed to update last read at server:", err);
        });
      }, 500),
    [userId, roomData.id, markSidebarAsRead],
  );

  const markAsRead = useCallback((messageId?: string) => {
    if (!userId || userId === "") return;
    markAsReadApi(messageId);
  }, [markAsReadApi, userId]);

  const handleNewMessage = useCallback(
    (msg: MessageWithUserDTO, isFromSync = false) => {
      if (msg.userId !== userId && !isFromSync && !isInitialLoadRef.current) {
        sendNotification(msg);
      }

      // If the message is from the current user, treat it as read automatically
      if (msg.userId === userId) {
        setLastReadIdState(msg.id);
        const at = new Date(msg.createdAt);
        setLastReadAtState(at);

        // Sync to cache immediately for current user's messages
        import("@/lib/infrastructure/cache/client-cache").then((m) => {
          m.clientChatCache.setLastRead(localRoomData.id, msg.id, at);
        });

        // Update the persisted ref to avoid redundant or out-of-order updates
        lastPersistedReadIdRef.current = msg.id;

        // HARDENING: If this is a real message (not optimistic), also update server
        if (!msg.isOptimistic && !msg.id.startsWith('optimistic-')) {
          updateLastReadAt(userId, localRoomData.id, msg.id, at).catch(console.error);
        }
      } else if (isAtBottom && !isFromSync) {
        // If we receive a message and we're already at the bottom, mark it as read
        markAsRead(msg.id);
      }

      setMessages((prev) => {
        const existingIndex = prev.findIndex((m) => {
          // 1. Direct ID match (for server-pushed updates of existing messages)
          if (m.id === msg.id) return true;

          // 2. Optimistic ID match (for replacing the placeholder with the real server message)
          if (msg.optimisticId && m.optimisticId === msg.optimisticId) return true;

          return false;
        });

        let nextMessages: MessageWithUserDTO[];
        if (existingIndex > -1) {
          nextMessages = [...prev];
          nextMessages[existingIndex] = { ...msg, isOptimistic: false };
        } else {
          nextMessages = [...prev, msg];
        }

        if (!msg.isOptimistic) {
          import("@/lib/infrastructure/cache/client-cache").then((m) => {
            m.clientChatCache.mergeMessages(localRoomData.id, [msg]);
          });
        }

        return nextMessages;
      });
    },
    [userId, localRoomData.id, sendNotification, isAtBottom, markAsRead],
  );

  // Ensure read state is flushed on unmount/visibility hidden
  useEffect(() => {
    const flushReadState = async () => {
      let lastReadId = lastPersistedReadIdRef.current;
      if (lastReadId) {
        // Find the message in current ref to get its timestamp if possible
        let msg = messagesRef.current.find(m => m.id === lastReadId);

        // HARDENING: If the last tracked ID is optimistic, find the latest real one before it
        if (!msg || msg.isOptimistic || lastReadId.startsWith('optimistic-')) {
          const lastRealMsg = messagesRef.current.findLast(m => !m.isOptimistic && !m.id.startsWith('optimistic-'));
          if (lastRealMsg) {
            msg = lastRealMsg;
            lastReadId = msg.id;
          } else {
            return; // No real messages to mark as read
          }
        }

        const at = msg ? new Date(msg.createdAt) : undefined;

        if (!userId || userId === "" || userId === "null") return;

        markSidebarAsRead(roomData.id);
        updateLastReadAt(userId, roomData.id, lastReadId, at).catch(console.error);

        // Also update cache on flush
        import("@/lib/infrastructure/cache/client-cache").then((m) => {
          m.clientChatCache.setLastRead(roomData.id, lastReadId, at);
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushReadState();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      flushReadState(); // Flush on unmount
    };
  }, [userId, roomData.id, markSidebarAsRead]);

  const syncMessages = useCallback(async () => {
    const currentMessages = messagesRef.current;
    if (currentMessages.length === 0) return;

    const lastMessage = currentMessages[currentMessages.length - 1];
    const afterDate = new Date(lastMessage.createdAt);

    const response = await getMessage(roomData.id, 50, undefined, afterDate);
    if (response.status === "success" && response.data) {
      response.data.forEach((msg) => handleNewMessage(msg, true));
    }
  }, [roomData.id, handleNewMessage]);

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMore) return;

    const viewport = viewportRef.current;
    const previousScrollHeight = viewport?.scrollHeight ?? 0;

    setIsLoadingMore(true);
    const oldestMessage = messages[0];
    const beforeDate = oldestMessage
      ? new Date(oldestMessage.createdAt)
      : undefined;

    const response = await getMessage(roomData.id, 50, beforeDate);
    if (response.status === "success" && response.data) {
      if (response.data.length < 50) setHasMore(false);
      setMessages((prev) => {
        const prevIds = new Set(prev.map(m => m.id));
        const nonDuplicates = response.data!.filter(m => !prevIds.has(m.id));
        return [...nonDuplicates, ...prev];
      });
    }
    setIsLoadingMore(false);
  };

  useScrollToInitial(messages, unreadRef, bottomRef);
  useAutoScroll(messages, userId, isAtBottom, bottomRef);
  useAutoFocusInput(inputRef);
  useMarkAsRead(bottomRef, viewportRef, setIsAtBottom, markAsRead);

  useEffect(() => {
    if (!isMobile) {
      setShowMembers(true);
    } else {
      setShowMembers(false);
    }
  }, [isMobile]);

  useEffect(() => {
    const chatChannel = pusher.subscribe(`chat-${roomData.id}`);
    chatChannel.bind("new-message", (msg: MessageWithUserDTO) =>
      handleNewMessage(msg),
    );
    chatChannel.bind("message-updated", (updatedMsg: MessageWithUserDTO) => {
      setMessages((prev) => prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m)));
    });
    chatChannel.bind("message-reaction", ({ messageId, action, reaction }: any) => {
      setMessages((prev) => prev.map((m) => {
        if (m.id !== messageId) return m;

        const currentReactions = m.reactions || [];
        let nextReactions;

        if (action === "added") {
          // 1. Purge any optimistic entry for the same userId+emoji to prevent duplicates
          const withoutOptimistic = currentReactions.filter(
            (r) => !(
              r.id.startsWith('optimistic-') &&
              r.userId === reaction.userId &&
              r.emoji === reaction.emoji
            )
          );
          // 2. Only append the real entry if it isn't already present
          const alreadyExists = withoutOptimistic.some((r) => r.id === reaction.id);
          nextReactions = alreadyExists ? withoutOptimistic : [...withoutOptimistic, reaction];
        } else {
          // Remove by real ID and also purge any lingering optimistic entry for same userId+emoji
          nextReactions = currentReactions.filter(
            (r) => r.id !== reaction.id &&
              !(
                r.id.startsWith('optimistic-') &&
                r.userId === reaction.userId &&
                r.emoji === reaction.emoji
              )
          );
        }

        return { ...m, reactions: nextReactions };
      }));
    });
    chatChannel.bind("message-deleted", ({ messageId }: { messageId: string }) => {
      setMessages((prev) => {
        const deletedIndex = prev.findIndex((m) => m.id === messageId);
        if (deletedIndex === -1) return prev;

        // If the deleted message is our current "last read" anchor, pick a new one.
        // We pick the message immediately BEFORE it to maintain the read position.
        if (messageId === lastPersistedReadIdRef.current) {
          const newAnchorMsg = prev[deletedIndex - 1];
          const newAnchorId = newAnchorMsg?.id || null;
          const newAnchorAt = newAnchorMsg ? new Date(newAnchorMsg.createdAt) : null;

          setLastReadIdState(newAnchorId);
          setLastReadAtState(newAnchorAt);
          lastPersistedReadIdRef.current = newAnchorId;

          // Also update cache and server
          import("@/lib/infrastructure/cache/client-cache").then((m) => {
            m.clientChatCache.setLastRead(roomData.id, newAnchorId, newAnchorAt);
          });

          if (newAnchorId && newAnchorAt) {
            updateLastReadAt(userId, roomData.id, newAnchorId, newAnchorAt).catch(console.error);
          }
        }

        return prev.filter((m) => m.id !== messageId);
      });

      import("@/lib/infrastructure/cache/client-cache").then((m) => {
        m.clientChatCache.removeMessage(roomData.id, messageId);
      });
    });
    const handleConnected = () => syncMessages();
    pusher.connection.bind("connected", handleConnected);
    const handleFocus = () => syncMessages();
    window.addEventListener("focus", handleFocus);

    return () => {
      chatChannel.unbind_all();
      chatChannel.unsubscribe();
      pusher.connection.unbind("connected", handleConnected);
      window.removeEventListener("focus", handleFocus);
    };
  }, [roomData.id, handleNewMessage, syncMessages]);

  const handleMessageSend = useCallback(
    (msg: MessageWithUserDTO) => {
      handleNewMessage(msg);
      markAsRead();
    },
    [handleNewMessage, markAsRead],
  );

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleSaveEdit = useCallback(async (messageId: string, content: string) => {
    const response = await editMessageAction(userId, messageId, content);
    if (response.status === "success" && response.data) {
      setMessages((prev) => prev.map((m) => (m.id === response.data!.id ? response.data! : m)));
      setEditingMessageId(null);
    } else {
      toast.error(response.error?.message || "Gagal mengedit pesan");
    }
  }, [userId]);

  const handleStartEditLast = useCallback(() => {
    const userMessages = messages.filter((m) => m.userId === userId && !m.isOptimistic);
    if (userMessages.length > 0) {
      const lastMsg = userMessages[userMessages.length - 1];
      setEditingMessageId(lastMsg.id);
    }
  }, [messages, userId]);

  const handleToggleReaction = useCallback(async (messageId: string, emoji: string) => {
    // 1. Find message and current reaction status
    const message = messagesRef.current.find(m => m.id === messageId);
    if (!message) return;

    const existingReaction = (message.reactions || []).find(
      r => r.userId === userId && r.emoji === emoji
    );

    // 2. Prepare Optimistic Update
    const action = existingReaction ? "removed" : "added";

    setMessages((prev) => prev.map((m) => {
      if (m.id !== messageId) return m;

      const currentReactions = m.reactions || [];
      let nextReactions;

      if (action === "added") {
        nextReactions = [
          ...currentReactions,
          {
            id: `optimistic-${createId()}`,
            messageId,
            userId,
            emoji,
            createdAt: new Date(),
            updatedAt: new Date(),
            user: { username: user.username }
          }
        ];
      } else {
        nextReactions = currentReactions.filter((r) => !(r.userId === userId && r.emoji === emoji));
      }

      return { ...m, reactions: nextReactions };
    }));

    // 3. Call Server Action
    const response = await toggleReactionAction(userId, messageId, emoji);

    if (response.status === "error") {
      toast.error(response.error?.message || "Gagal memberikan reaksi");

      // Rollback on error
      setMessages((prev) => prev.map((m) => {
        if (m.id !== messageId) return m;
        return { ...m, reactions: message.reactions };
      }));
    }
  }, [userId, user.username]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <ChatHeader
        roomData={localRoomData}
        currentUserId={userId}
        onToggleMembers={() => setShowMembers((prev) => !prev)}
        onToggleSearch={() => setIsSearchOpen(true)}
        membersVisible={showMembers}
        onlineUserIds={onlineUserIds}
        onUpdateRoom={(data) =>
          setLocalRoomData((prev) => ({ ...prev, ...data }))
        }
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">
            <MessageList
              userId={userId}
              messages={messages}
              bottomRef={bottomRef}
              unreadRef={unreadRef}
              onlineUserIds={onlineUserIds}
              onReply={(message) => setReplyingTo(message)}
              onStartEdit={(message) => setEditingMessageId(message.id)}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={() => setEditingMessageId(null)}
              onToggleReaction={handleToggleReaction}
              editingMessageId={editingMessageId}
              lastReadMessageId={lastReadIdState}
              lastReadAt={lastReadAtState}
              onLoadMore={loadMoreMessages}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              viewportRef={viewportRef}
              roomData={localRoomData}
              highlightedMessageId={highlightedMessageId}
              onScrollToMessage={scrollToMessage}
            />
          </div>
          <MessageInput
            userId={userId}
            roomData={roomData}
            replyingTo={replyingTo}
            onCancelReply={handleCancelReply}
            inputRef={inputRef}
            onNewMessage={handleMessageSend}
            onStartEditLast={handleStartEditLast}
            user={user}
          />
        </div>
        {showMembers && !isMobile && (
          <div className="hidden lg:block">
            <MemberList
              roomData={roomData}
              onlineUserIds={onlineUserIds}
              currentUserId={userId}
            />
          </div>
        )}
      </div>
      <MobileMemberList
        roomData={roomData}
        onlineUserIds={onlineUserIds}
        isOpen={showMembers && isMobile}
        onClose={() => setShowMembers(false)}
        currentUserId={userId}
      />
      <MessageSearch
        isOpen={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        roomId={localRoomData.id}
        onSelectMessage={scrollToMessage}
      />
    </div>
  );
}
