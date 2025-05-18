"use client";

import { useState } from "react";
import { createMessage } from "@/app/(with-sidebar)/app/messages.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  userId: string;
  roomId: string;
}

export function MessageInput({ userId, roomId }: Props) {
  const [content, setContent] = useState("");

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault(); 
    if (!content.trim()) return;

    const response = await createMessage(userId, content, roomId, false);

    if (response.status === "success") {
      setContent("");
    } else {
      console.error("Gagal mengirim pesan:", response.error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {

      e.preventDefault(); 
      handleSend();
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSend}
        className="p-4 border-t border-[#1e1f22] flex gap-2"
      >
        <Input
          autoFocus
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          type="text"
          placeholder="Message #general"
          className="flex-1 px-4 py-2 rounded-md bg-[#1e1f22] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
        />
        <Button
          type="submit"
          disabled={!content.trim()} 
          className="px-4 py-2 bg-[#5865f2] text-white rounded-md hover:bg-[#4752c4] disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          send
        </Button>
      </form>
    </div>
  );
}
