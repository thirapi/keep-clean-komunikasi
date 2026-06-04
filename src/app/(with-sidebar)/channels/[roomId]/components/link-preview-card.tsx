"use client";

import { useState, useEffect, useMemo } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { LinkPreview } from "@/lib/application/services/link-preview.service.interface";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LinkPreviewCardProps {
  url: string;
  preview?: {
    title?: string | null;
    description?: string | null;
    image?: string | null;
    siteName?: string | null;
  };
}

export function LinkPreviewCard({ url, preview }: LinkPreviewCardProps) {
  const [data, setData] = useState<LinkPreview | null>(preview ? { ...preview, url } as any : null);
  const [loading, setLoading] = useState(!preview);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (preview) return;

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
      <div className="flex items-center gap-2 py-1.5 px-2 text-[10px] text-muted-foreground/40">
        <Loader2 className="h-3 w-3 animate-spin" />
        Memuat pratinjau...
      </div>
    );
  }

  if (error || !data || (!data.title && !data.description)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-1.5 max-w-[500px] w-full"
    >
      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
            "group relative flex flex-col bg-muted/10 hover:bg-muted/20",
            "border border-border/30 rounded-xl overflow-hidden transition-all duration-200"
        )}
      >
        <div className="px-3.5 py-3 flex flex-col gap-1.5">
          {/* Header: Favicon + Site Name */}
          <div className="flex items-center gap-1.5 min-w-0 mb-0.5">
            {(data as any).favicon ? (
              <img 
                src={(data as any).favicon} 
                alt="" 
                className="w-3.5 h-3.5 rounded-sm object-contain shrink-0 opacity-80"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            ) : (
              <ExternalLink className="w-3 h-3 text-muted-foreground/30 shrink-0" />
            )}
            <span className="text-[11px] font-medium text-muted-foreground/70 truncate tracking-tight">
              {data.siteName || hostname}
            </span>
          </div>

          {/* Body: Title + Description */}
          <div className="space-y-1">
            <h4 className="text-[13px] font-bold text-foreground/90 group-hover:text-primary transition-colors leading-snug line-clamp-2">
              {data.title}
            </h4>
            {data.description && (
              <p className="text-[12px] text-muted-foreground/80 leading-normal line-clamp-2">
                {data.description}
              </p>
            )}
          </div>

          {/* Image */}
          {data.image && (
            <div className="mt-2 relative aspect-video w-full max-h-[220px] overflow-hidden rounded-lg border border-border/10 bg-muted/20">
              <img
                src={data.image}
                alt=""
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.015]"
                onError={(e) => (e.currentTarget.parentElement!.style.display = "none")}
              />
            </div>
          )}
        </div>
      </a>
    </motion.div>
  );
}
