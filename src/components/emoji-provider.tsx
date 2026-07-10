"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

interface CustomEmoji {
    shortcode: string;
    url: string;
}

interface EmojiContextType {
    customEmojis: CustomEmoji[];
    isLoading: boolean;
    refresh: () => Promise<void>;
}

const EmojiContext = createContext<EmojiContextType | undefined>(undefined);

export function EmojiProvider({ children }: { children: React.ReactNode }) {
    const [customEmojis, setCustomEmojis] = useState<CustomEmoji[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchEmojis = async () => {
        setIsLoading(true);
        try {
            setCustomEmojis([]);
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
