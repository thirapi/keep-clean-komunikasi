"use client";

export default function LoadingRoom() {
  const skeletonMessages = Array.from({ length: 6 });

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      {skeletonMessages.map((_, i) => (
        <div
          key={i}
          className="relative flex items-start gap-3 p-2 rounded-md bg-muted/30 animate-pulse"
        >
          {/* Avatar + Status */}
          <div className="relative">
            <div className="w-10 h-10 bg-zinc-600 rounded-md" />
            <div className="h-2.5 w-2.5 rounded-full bg-gray-500 ring-[2px] ring-background absolute bottom-0 right-0" />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-2">
            {/* Username + Timestamp */}
            <div className="flex items-center gap-2">
              <div className="w-24 h-3 rounded bg-zinc-500" />
              <div className="w-20 h-2 rounded bg-zinc-600" />
            </div>

            {/* Message Content */}
            <div className="w-full h-4 bg-zinc-700 rounded" />
            <div className="w-2/3 h-3 bg-zinc-600 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
