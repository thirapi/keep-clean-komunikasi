"use client";

import { Users2, Hash } from "lucide-react";

export default function LoadingRoom() {
  const skeletonMessages = Array.from({ length: 6 });

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Skeleton Header */}
      <div className="flex items-center justify-between border-b bg-background/60 backdrop-blur-xl px-4 py-3 md:px-6 h-16 animate-pulse">
        <div className="flex items-center gap-3 md:gap-4 flex-1">
          <div className="md:hidden w-8 h-8 rounded-md bg-muted" />
          <div className="h-8 w-8 rounded-md bg-muted shrink-0" />
          <div className="flex flex-col gap-2">
            <div className="w-32 h-4 rounded bg-muted" />
            <div className="w-20 h-2 rounded bg-muted/60" />
          </div>
        </div>
        <div className="w-8 h-8 rounded-md bg-muted" />
      </div>

      {/* Skeleton Messages */}
      <div className="flex-1 overflow-hidden">
        <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
          {skeletonMessages.map((_, i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-md bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-24 h-3 rounded bg-muted" />
                  <div className="w-16 h-2 rounded bg-muted/40" />
                </div>
                <div className="w-full h-4 rounded bg-muted/60" />
                <div className="w-[80%] h-4 rounded bg-muted/40" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skeleton Input */}
      <div className="p-4 border-t bg-background">
        <div className="h-10 w-full rounded-xl bg-muted animate-pulse" />
      </div>
    </div>
  );
}
