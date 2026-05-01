// src/lib/infrastructure/cache/client-cache.ts
import { MessageWithUserDTO } from "@/lib/entities/models/message.model";

class ClientChatCache {
  private messages = new Map<string, MessageWithUserDTO[]>();
  private rooms = new Map<string, any>();
  private lastRead = new Map<string, string | null>();

  constructor() {}

  setMessages(roomId: string, messages: MessageWithUserDTO[]) {
    const limited = messages.slice(-50);
    this.messages.set(roomId, limited);
    this.persistMessages(roomId, limited);
  }

  mergeMessages(roomId: string, newMessages: MessageWithUserDTO[]) {
    const existing = this.getMessages(roomId) || [];
    const map = new Map([...existing, ...newMessages].map(m => [m.id, m]));
    const merged = Array.from(map.values())
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-50);
    
    this.messages.set(roomId, merged);
    this.persistMessages(roomId, merged);
  }

  setRoom(roomId: string, roomData: any) {
    this.rooms.set(roomId, roomData);
    this.persistRoom(roomId, roomData);
  }

  setLastRead(roomId: string, messageId: string | null) {
    this.lastRead.set(roomId, messageId);
    if (typeof window !== "undefined") {
      if (messageId) {
        localStorage.setItem(`chat_last_read_${roomId}`, messageId);
      } else {
        localStorage.removeItem(`chat_last_read_${roomId}`);
      }
    }
  }

  getMessages(roomId: string): MessageWithUserDTO[] | undefined {
    if (this.messages.has(roomId)) return this.messages.get(roomId);
    
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`chat_msg_${roomId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this.messages.set(roomId, parsed);
          return parsed;
        } catch (e) {
          return undefined;
        }
      }
    }
    return undefined;
  }

  getRoom(roomId: string): any | undefined {
    if (this.rooms.has(roomId)) return this.rooms.get(roomId);
    
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`chat_room_${roomId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this.rooms.set(roomId, parsed);
          return parsed;
        } catch (e) {
          return undefined;
        }
      }
    }
    return undefined;
  }

  getLastRead(roomId: string): string | null | undefined {
    if (this.lastRead.has(roomId)) return this.lastRead.get(roomId);
    
    if (typeof window !== "undefined") {
      return localStorage.getItem(`chat_last_read_${roomId}`);
    }
    return undefined;
  }

  invalidate(roomId: string) {
    this.messages.delete(roomId);
    this.rooms.delete(roomId);
    this.lastRead.delete(roomId);
    if (typeof window !== "undefined") {
      localStorage.removeItem(`chat_msg_${roomId}`);
      localStorage.removeItem(`chat_room_${roomId}`);
      localStorage.removeItem(`chat_last_read_${roomId}`);
    }
  }

  private persistMessages(roomId: string, messages: MessageWithUserDTO[]) {
    if (typeof window !== "undefined") {
      localStorage.setItem(`chat_msg_${roomId}`, JSON.stringify(messages));
    }
  }

  private persistRoom(roomId: string, roomData: any) {
    if (typeof window !== "undefined") {
      localStorage.setItem(`chat_room_${roomId}`, JSON.stringify(roomData));
    }
  }
}

export const clientChatCache = new ClientChatCache();
