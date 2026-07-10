"use client";

import { useEffect, useState } from "react";
import { getImpersonationStatus } from "@/app/impersonate.action";

export function useIsImpersonating() {
    const [isImpersonating, setIsImpersonating] = useState(false);
    const [impersonatedUser, setImpersonatedUser] = useState<{ username: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getImpersonationStatus().then((data) => {
            if (data) {
                setIsImpersonating(true);
                setImpersonatedUser(data);
            }
            setLoading(false);
        });
    }, []);

    return { isImpersonating, impersonatedUser, loading };
}
