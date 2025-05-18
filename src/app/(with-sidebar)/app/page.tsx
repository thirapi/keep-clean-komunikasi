"use client";
import { useEffect } from "react";
import { useBreadcrumbs } from "@/components/breadcrumb/breadcrumb-context";
import { MessageInput } from "./message-input";

export default function Page() {
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([{ label: "App", href: "/app" }]);
  }, [setBreadcrumbs]);

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 ">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white">
            A
          </div>
          <div>
            <div className="text-sm font-semibold text-white">
              Alice
              <span className="text-xs text-gray-400 ml-2">10:30 AM</span>
            </div>
            <div className="text-sm text-gray-300">Hey, are you there?</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white">
            B
          </div>
          <div>
            <div className="text-sm font-semibold text-white">
              Bob
              <span className="text-xs text-gray-400 ml-2">10:32 AM</span>
            </div>
            <div className="text-sm text-gray-300">Yeah, what's up?</div>
          </div>
        </div>
      </div>
      <MessageInput userId="user-id" roomId="room-id" />
    </div>
  );
}
