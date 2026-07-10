"use client";

import { startImpersonation } from "@/app/impersonate.action";
import { UserSwitch } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";

export function ImpersonateButton({ targetUserId, username }: { targetUserId: string; username: string }) {
    const handleImpersonate = async () => {
        const result = await startImpersonation(targetUserId);
        if (result.status === "success") {
            toast.success(`Impersonating @${username}`);
            window.location.href = "/channels/default";
        } else {
            toast.error(result.error || "Gagal impersonate");
        }
    };

    return (
        <button
            onClick={handleImpersonate}
            title={`Impersonate @${username}`}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
            <UserSwitch weight="duotone" className="h-4 w-4" />
        </button>
    );
}
