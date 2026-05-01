// src/lib/infrastructure/cache/client-cache.ts
import { MessageWithUserDTO } from "@/lib/entities/models/message.model";

class ClientChatCache {
  private messages = new Map<string, MessageWithUserDTO[]>();
  private rooms = new Map<string, any>();

  constructor() {
    if (typeof window !== "undefined") {
      // Migrate old data if necessary (optional, but keep it simple for now)
      // We will switch to individual keys.
      // For now, we will load existing cache keys on demand or via explicit keys.
    }
  }

  setMessages(roomId: string, messages: MessageWithUserDTO[]) {
    // Keep only last 50
    const limited = messages.slice(-50);
    this.messages.set(roomId, limited);
    this.persistMessages(roomId, limited);
  }

  mergeMessages(roomId: string, newMessages: MessageWithUserDTO[]) {
    const existing = this.getMessages(roomId) || [];
    // Merge and deduplicate by ID
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

  getMessages(roomId: string): MessageWithUserDTO[] | undefined {
    if (this.messages.has(roomId)) return this.messages.get(roomId);
    
    // Fallback load from localStorage
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
    return undefined;
  }

  getRoom(roomId: string): any | undefined {
    if (this.rooms.has(roomId)) return this.rooms.get(roomId);
    
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
    return undefined;
  }

  invalidate(roomId: string) {
    this.messages.delete(roomId);
    this.rooms.delete(roomId);
    if (typeof window !== "undefined") {
      localStorage.removeItem(`chat_msg_${roomId}`);
      localStorage.removeItem(`chat_room_${roomId}`);
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
