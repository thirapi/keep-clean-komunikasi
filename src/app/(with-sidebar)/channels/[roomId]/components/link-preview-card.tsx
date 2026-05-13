"use client";

import { useState, useEffect, useMemo } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { LinkPreview } from "@/lib/application/services/link-preview.service.interface";
import { motion } from "framer-motion";

interface LinkPreviewCardProps {
  url: string;
}

export function LinkPreviewCard({ url }: LinkPreviewCardProps) {
  const [data, setData] = useState<LinkPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (!data.error) {
            setData(data);
          } else {
            setError(true);
          }
        }
      })
      .catch(() => {
        if (isMounted) setError(true);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [url]);

  const hostname = useMemo(() => {
    if (!data?.url) return "";
    try {
      return new URL(data.url).hostname.replace("www.", "");
    } catch {
      return "";
    }
  }, [data?.url]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-1.5 px-2 text-[10px] text-muted-foreground/50">
        <Loader2 className="h-3 w-3 animate-spin" />
        Memuat pratinjau...
      </div>
    );
  }

  if (error || !data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-1 max-w-[400px] w-full"
    >
      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex flex-col bg-muted/20 hover:bg-muted/40 border border-border/40 rounded-md overflow-hidden transition-all duration-200"
      >
        {/* Accent Bar */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary/30 group-hover:bg-primary transition-colors"
          style={{ backgroundColor: (data as any).themeColor || undefined }}
        />

        <div className="pl-3.5 pr-3 py-2.5 flex flex-col gap-1">
          {/* Header: Favicon + Site Name */}
          <div className="flex items-center gap-1.5 min-w-0">
            {(data as any).favicon ? (
              <img 
                src={(data as any).favicon} 
                alt="" 
                className="w-3.5 h-3.5 rounded-sm object-contain shrink-0"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            ) : (
              <ExternalLink className="w-3 h-3 text-muted-foreground/40 shrink-0" />
            )}
            <span className="text-[11px] font-medium text-muted-foreground/80 truncate">
              {data.siteName || hostname}
            </span>
          </div>

          {/* Body: Title + Description */}
          <div className="space-y-0.5">
            <h4 className="text-[12.5px] font-bold text-primary group-hover:underline leading-snug line-clamp-1">
              {data.title}
            </h4>
            {data.description && (
              <p className="text-[11.5px] text-foreground/70 leading-normal line-clamp-2">
                {data.description}
              </p>
            )}
          </div>

          {/* Image */}
          {data.image && (
            <div className="mt-1 relative aspect-video w-full max-h-[180px] overflow-hidden rounded border border-border/10 bg-muted/30">
              <img
                src={data.image}
                alt=""
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
                onError={(e) => (e.currentTarget.parentElement!.style.display = "none")}
              />
            </div>
          )}
        </div>
      </a>
    </motion.div>
  );
}
