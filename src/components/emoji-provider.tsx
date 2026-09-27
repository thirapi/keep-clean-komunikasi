"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { getCustomEmojisAction, CustomEmojiDTO } from "@/app/emoji.action";

interface EmojiStatusContextType {
    isLoading: boolean;
    refresh: () => Promise<void>;
}

// Two separate contexts on purpose. The list of emojis and the loading flag
// change independently, and every message row reads the list — bundling
// `isLoading` into the same context value re-rendered all of them a second time
// when the fetch resolved.
const EmojiDataContext = createContext<CustomEmojiDTO[] | undefined>(undefined);
const EmojiStatusContext = createContext<EmojiStatusContextType | undefined>(undefined);

export function EmojiProvider({ children }: { children: React.ReactNode }) {
    const [customEmojis, setCustomEmojis] = useState<CustomEmojiDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchEmojis = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await getCustomEmojisAction();
            if (res.status === "success" && res.data) {
                setCustomEmojis(res.data);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmojis();
    }, [fetchEmojis]);

    const statusValue = useMemo(
        () => ({ isLoading, refresh: fetchEmojis }),
        [isLoading, fetchEmojis],
    );

    return (
        <EmojiDataContext.Provider value={customEmojis}>
            <EmojiStatusContext.Provider value={statusValue}>
                {children}
            </EmojiStatusContext.Provider>
        </EmojiDataContext.Provider>
    );
}

/**
 * Custom emoji list only. Preferred by render paths that do not need the
 * loading flag, so they do not re-render when the flag flips.
 */
export function useCustomEmojis() {
    const context = useContext(EmojiDataContext);
    if (context === undefined) {
        throw new Error("useCustomEmojis must be used within an EmojiProvider");
    }
    return context;
}

export function useEmojis() {
    const customEmojis = useContext(EmojiDataContext);
    const status = useContext(EmojiStatusContext);
    if (customEmojis === undefined || status === undefined) {
        throw new Error("useEmojis must be used within an EmojiProvider");
    }
    return { customEmojis, isLoading: status.isLoading, refresh: status.refresh };
}
