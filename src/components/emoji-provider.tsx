"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { getCustomEmojisAction, CustomEmojiDTO } from "@/app/emoji.action";

interface EmojiContextType {
    customEmojis: CustomEmojiDTO[];
    isLoading: boolean;
    refresh: () => Promise<void>;
}

const EmojiContext = createContext<EmojiContextType | undefined>(undefined);

export function EmojiProvider({ children }: { children: React.ReactNode }) {
    const [customEmojis, setCustomEmojis] = useState<CustomEmojiDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchEmojis = async () => {
        setIsLoading(true);
        try {
            const res = await getCustomEmojisAction();
            if (res.status === "success" && res.data) {
                setCustomEmojis(res.data);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEmojis();
    }, []);

    const value = useMemo(() => ({
        customEmojis,
        isLoading,
        refresh: fetchEmojis
    }), [customEmojis, isLoading]);

    return (
        <EmojiContext.Provider value={value}>
            {children}
        </EmojiContext.Provider>
    );
}

export function useEmojis() {
    const context = useContext(EmojiContext);
    if (context === undefined) {
        throw new Error("useEmojis must be used within an EmojiProvider");
    }
    return context;
}
