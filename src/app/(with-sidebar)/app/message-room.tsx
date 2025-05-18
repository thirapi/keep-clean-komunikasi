"use client";
import { useEffect, useState } from "react";
import { pusher } from "@/lib/pusher/pusher.client";

export default function MessageRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<any[]>([]);

//   useEffect(() => {
//     const channel = pusher.subscribe(roomId);
//     channel.bind("message", (message: any) => {
//       setMessages((prevMessages) => [...prevMessages, message]);
//     });

//     return () => {
//       channel.unbind_all();
//       pusher.unsubscribe(roomId);
//     };
//   }, [roomId]);

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white">
              {message.sender}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                {message.sender}
                <span className="text-xs text-gray-400 ml-2">{message.time}</span>
              </div>
              <div className="text-sm text-gray-300">{message.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}