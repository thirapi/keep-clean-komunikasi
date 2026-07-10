"use client";

import { useEffect, useState } from "react";
import { getImpersonationStatus, stopImpersonation } from "@/app/impersonate.action";
import { X } from "@phosphor-icons/react/dist/ssr";

export function ImpersonationBanner() {
    const [status, setStatus] = useState<{ userId: string; username: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getImpersonationStatus().then((data) => {
            setStatus(data);
            setLoading(false);
        });
    }, []);

    if (loading || !status) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-destructive/90 text-destructive-foreground px-3 py-[3px] text-[11px] font-medium shadow-sm">
            <span className="flex items-center gap-2">
                Impersonasi: <strong>@{status.username}</strong>
            </span>
            <form
                action={async () => {
                    await stopImpersonation();
                    window.location.reload();
                }}
                className="absolute right-2"
            >
                <button
                    type="submit"
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-destructive-foreground/20 hover:bg-destructive-foreground/40 transition-colors text-[10px]"
                >
                    <X weight="bold" className="h-2.5 w-2.5" />
                    Stop
                </button>
            </form>
        </div>
    );
}
