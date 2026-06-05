"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { CaretDown, CaretUp } from "@phosphor-icons/react/dist/ssr";

interface XEmbedProps {
    tweetUrl: string;
    className?: string;
}

declare global {
    interface Window {
        twttr?: {
            widgets: {
                load: (element?: HTMLElement) => void;
            };
        };
    }
}

export function XEmbed({ tweetUrl, className }: XEmbedProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const { resolvedTheme } = useTheme();
    const theme = resolvedTheme === "dark" ? "dark" : "light";

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !isVisible) return;

        const loadWidgets = () => {
            if (window.twttr?.widgets) {
                window.twttr.widgets.load(container);
            }
        };

        if (!document.getElementById("twitter-widget-script")) {
            const script = document.createElement("script");
            script.id = "twitter-widget-script";
            script.src = "https://platform.twitter.com/widgets.js";
            script.async = true;
            script.charset = "utf-8";
            script.onload = loadWidgets;
            document.body.appendChild(script);
        } else {
            loadWidgets();
        }
    }, [tweetUrl, isVisible]);

    return (
        <div className={cn("mt-2 max-w-[550px]", className)}>
            {/* Toggle header */}
            <button
                onClick={() => setIsVisible((v) => !v)}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors mb-1"
            >
                {isVisible ? <CaretUp weight="duotone" className="w-3.5 h-3.5" /> : <CaretDown weight="duotone" className="w-3.5 h-3.5" />}
                X / Twitter
            </button>

            {isVisible && (
                // clip-path works at the compositing layer and reliably clips iframes,
                // unlike overflow:hidden + border-radius which fails on cross-origin frames.
                // inset(0 round 1rem) = rounded-2xl equivalent (16px)
                <div
                    ref={containerRef}
                    style={{ clipPath: "inset(0 round 14px)" }}
                >
                    <blockquote
                        className="twitter-tweet"
                        data-dnt="true"
                        data-theme={theme}
                    >
                        <a href={tweetUrl}>{tweetUrl}</a>
                    </blockquote>
                </div>
            )}
        </div>
    );
}
