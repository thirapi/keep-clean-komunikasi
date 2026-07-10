import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import { MessageWithUserDTO } from "@/lib/entities/models/message.model";
import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";
import { YouTubeEmbed } from "@/components/ui/youtube-embed";
import { XEmbed } from "@/components/ui/x-embed";
import { UserAvatar } from "@/components/ui/user-avatar";
import { MentionTextarea } from "@/components/ui/mention-textarea";
import { EmojiPickerComponent } from "@/components/emoji-picker/emoji-picker";
import { useEmojis } from "@/components/emoji-provider";

// Module-level constants — compiled once, not on every render
import { extractUrls } from "@/lib/extract-urls";
const YOUTUBE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const X_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/([a-zA-Z0-9_]+)\/status\/(\d+)/;
import { ArrowBendUpLeft, ChatTeardropText, File, DownloadSimple, ArrowSquareOut, Trash, Copy, PencilSimple, Check, X, Smiley, Sparkle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createRoom } from "../room.action";
import { deleteMessageAction, toggleReactionAction } from "../messages.action";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ImageLightbox, ImageSource } from "@/components/ui/image-lightbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ProfileHoverCard } from "@/components/ui/profile-hover-card";

function truncate(str: string, max = 100) {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

export function MessageItem({
  message,
  onlineUserIds,
  onReply,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onToggleReaction,
  isEditing,
  currentUserId,
  isContinuation,
  isAfterSeparator,
  isHighlighted,
  onScrollToMessage,
  roomData,
}: {
  message: MessageWithUserDTO;
  onlineUserIds: string[];
  onReply: (message: MessageWithUserDTO) => void;
  onStartEdit: (message: MessageWithUserDTO) => void;
  onSaveEdit: (messageId: string, content: string) => void;
  onCancelEdit: () => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  isEditing: boolean;
  currentUserId: string;
  isContinuation?: boolean;
  isAfterSeparator?: boolean;
  isHighlighted?: boolean;
  onScrollToMessage?: (messageId: string) => void;
  roomData?: RoomWithParticipantsDTO;
}) {
  const router = useRouter();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [initialImageIndex, setInitialImageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const isMobile = useIsMobile();

  // Inline edit state
  const [editContent, setEditContent] = useState(message.content || "");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const editInputRef = useRef<HTMLDivElement>(null);

  // When entering edit mode, populate and focus
  const resolveMentionsForEdit = useCallback((content: string) => {
    if (!content) return "";
    return content.replace(/<@([a-zA-Z0-9_-]+)>/g, (match, uid) => {
      if (uid === "everyone") return "@everyone";
      const participant = roomData?.participants?.find((p: any) => p.user.id === uid);
      return participant ? `@${participant.user.username}` : match;
    });
  }, [roomData]);

  const prepareMentionsForSave = useCallback((content: string) => {
    if (!content) return "";
    return content.replace(/(?<!<)@([a-zA-Z0-9_-]+)>/g, (match, username) => {
      if (username.toLowerCase() === "everyone") return "<@everyone>";
      const participant = roomData?.participants?.find((p: any) => p.user.username.toLowerCase() === username.toLowerCase());
      return participant ? `<@${participant.user.id}>` : match;
    });
  }, [roomData]);

  useEffect(() => {
    if (isEditing) {
      setEditContent(resolveMentionsForEdit(message.content || ""));
      // Lexical's autoFocus prop handles focus and cursor positioning
    }
  }, [isEditing, message.content]);


  const handleSaveEdit = async () => {
    const trimmed = editContent.trim();
    const originalParsed = resolveMentionsForEdit(message.content || "");
    if (!trimmed || trimmed === originalParsed || isSavingEdit) return;
    setIsSavingEdit(true);
    try {
      await onSaveEdit(message.id, prepareMentionsForSave(trimmed));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancelEdit();
    }
  };

  // Detect if message was edited
  const isEdited = useMemo(() => {
    if (!message.updatedAt || !message.createdAt) return false;
    const created = new Date(message.createdAt).getTime();
    const updated = new Date(message.updatedAt).getTime();
    // Allow 1 second tolerance for DB write delay
    return updated - created > 1000;
  }, [message.createdAt, message.updatedAt]);

  const formatEditedTime = (date: Date) => {
    return new Date(date).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Auto hide mobile actions after 3.5s to free up screen and prevent stuck UI
  useEffect(() => {
    if (showMobileActions) {
      const timer = setTimeout(() => setShowMobileActions(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [showMobileActions]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [mobileActionOpen, setMobileActionOpen] = useState(false);

  const handleStartDM = async (targetUserId: string) => {
    if (targetUserId === currentUserId) return;

    const response = await createRoom(currentUserId, targetUserId);
    if (response.status === "success" && response.data) {
      router.push(`/channels/${response.data.id}`);
    } else {
      toast.error(response.error?.message || "Gagal membuat percakapan");
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    const response = await deleteMessageAction(currentUserId, message.id);
    if (response.status === "error") {
      toast.error(response.error?.message || "Gagal menghapus pesan");
      setIsDeleting(false);
    } else {
      toast.success("Pesan dihapus");
      setDeleteConfirmOpen(false);
    }
  };

  const handleToggleReaction = async (emoji: string) => {
    if (!currentUserId || !message.id) return;
    onToggleReaction?.(message.id, emoji);
  };

  const groupedReactions = useMemo(() => {
    const groups: Record<string, { emoji: string; count: number; users: string[]; hasReacted: boolean }> = {};

    (message.reactions || []).forEach((r) => {
      if (!groups[r.emoji]) {
        groups[r.emoji] = { emoji: r.emoji, count: 0, users: [], hasReacted: false };
      }
      groups[r.emoji].count++;
      const displayName = r.userId === currentUserId ? "Anda" : (r.user?.username || "Seseorang");
      groups[r.emoji].users.push(displayName);
      if (r.userId === currentUserId) {
        groups[r.emoji].hasReacted = true;
      }
    });

    // Sort so "Anda" is first
    Object.values(groups).forEach(g => {
      g.users.sort((a, b) => (a === "Anda" ? -1 : b === "Anda" ? 1 : 0));
    });

    return Object.values(groups);
  }, [message.reactions, currentUserId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || "");
    toast.success("Teks disalin");
    setMobileActionOpen(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatTimestamp = (date: Date) => {
    const isToday = (d: Date) => {
      const now = new Date();
      return d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();
    };

    const time = formatTime(date);
    if (!isToday(date)) {
      const dateStr = date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });
      return `${dateStr}, ${time}`;
    }
    return time;
  };

  const isOnlyEmoji = (str: string) => {
    if (!str) return false;
    const cleanStr = str.replace(/\s/g, "");
    if (!cleanStr) return false;
    
    // Custom emojis check (Misskey/Pleroma style :shortcode:)
    // We allow multiple shortcodes but nothing else
    const customEmojiRegex = /^(:[a-zA-Z0-9_-]+:)+$/;
    if (customEmojiRegex.test(cleanStr)) return true;

    // Modern regex using Unicode property escapes to match all emojis, 
    // including ZWJ sequences, modifiers, and variation selectors.
    // We filter out digits/text if they aren't part of an emoji sequence.
    const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji_Modifier_Base}|\p{Emoji_Modifier}|\p{Emoji_Component}|[\u200D\uFE0F])*$/u;

    // Hardening: make sure it's not JUST numbers or punctuation that happen to have emoji properties
    const hasActualEmoji = /\p{Extended_Pictographic}/u.test(cleanStr);

    return (emojiRegex.test(cleanStr) && hasActualEmoji) || customEmojiRegex.test(cleanStr);
  };

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url) || url.startsWith('data:image/');
  };

  const isVideo = (url: string) => {
    return /\.(mp4|webm|ogg)$/i.test(url) || url.startsWith('data:video/');
  };

  const getFileName = (url: string) => {
    try {
      const parts = url.split('/');
      const lastPart = parts[parts.length - 1];
      return lastPart.replace(/^\d+-/, '');
    } catch {
      return 'Attachment';
    }
  };

  const getProxiedUrl = (url: string) => {
    if (!url) return "";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
    if (url.startsWith("/") || 
        url.startsWith(window.location.origin) || 
        url.startsWith(baseUrl) ||
        url.includes("/api/media-proxy")) {
        return url;
    }
    return `/api/media-proxy?url=${encodeURIComponent(url)}`;
  };

  const imagesAndVideos = useMemo(() => {
    return (message.attachments || [])
      .filter(a => isImage(a.url) || isVideo(a.url))
      .map(a => ({
        url: getProxiedUrl(a.url),
        filename: getFileName(a.url),
        type: isVideo(a.url) ? 'video' : 'image'
      }));
  }, [message.attachments]);

  const otherFiles = useMemo(() => {
    return (message.attachments || []).filter(a => !isImage(a.url) && !isVideo(a.url));
  }, [message.attachments]);

  const openLightbox = (index: number) => {
    setInitialImageIndex(index);
    setLightboxOpen(true);
  };

  const socialEmbeds = useMemo(() => {
    if (!message.content) return [];

    const urls = extractUrls(message.content);

    const embeds: React.ReactNode[] = [];
    
    // STRICT MANDATE: Only ONE link preview per message (focus on the first content link)
    if (urls.length > 0) {
      const url = urls[0];
      const ytMatch = url.match(YOUTUBE_REGEX);
      if (ytMatch) {
        embeds.push(<YouTubeEmbed key={url} videoId={ytMatch[1]} />);
      } else {
        const xMatch = url.match(X_REGEX);
        if (xMatch) {
          embeds.push(<XEmbed key={url} tweetUrl={url} />);
        }
      }

      // Show indicator for other links
      if (urls.length > 1) {
        embeds.push(
          <div key="more-links" className="text-[10px] text-muted-foreground/40 ml-1 py-1 italic">
            +{urls.length - 1} tautan lainnya
          </div>
        );
      }
    }

    return embeds;
  }, [message.content]);

  const resolveMentionsForView = (content: string, emojis: { name: string; url: string }[] | null | undefined = []) => {
    if (!content) return "";
    // Discord behavior: Preserve leading newlines, but trim trailing ones.
    const trimmedContent = content.replace(/\n+$/, "");
    const mentionBlocks: string[] = [];
    let processed = trimmedContent.replace(/<@([a-zA-Z0-9_-]+)>/g, (match, uid) => {
      let resolved = "";
      if (uid === "everyone") {
        resolved = "[@everyone](#mention:everyone)";
      } else {
        const participant = roomData?.participants?.find((p: any) => p.user.id === uid);
        resolved = participant ? `[@${participant.user.username}](#mention:${uid})` : `@${uid}`;
      }
      mentionBlocks.push(resolved);
      return `__MENTION_BLOCK_${mentionBlocks.length - 1}__`;
    });

    // --- DISCORD MARKDOWN FIXES ---
    // 0. Extract Code Blocks (triple backticks) to protect them from regex modifications
    const blockCodes: string[] = [];
    processed = processed.replace(/```[\s\S]*?```/g, (match) => {
      let normalized = match;
      if (!normalized.match(/\n```$/)) {
        normalized = normalized.replace(/```$/, "\n```");
      }
      blockCodes.push(normalized);
      return `__BLOCK_CODE_${blockCodes.length - 1}__`;
    });

    // 1. Allow single backticks (inline code) to span multiple lines safely
    processed = processed.replace(/(?<!`)`([^`]+)`(?!`)/g, (match, inner) => {
      return '`' + inner.replace(/\n/g, '\uE000').replace(/ /g, '\u00A0') + '`';
    });

    // 3. Preserve leading spaces
    processed = processed.replace(/^( +)(?![-*>] |\d+\. )/gm, (match) =>
      '\u00A0'.repeat(match.length)
    );

    // --- GREEN TEXT (IMAGEBOARD STYLE) ---
    // Process each line. If it starts with '>', wrap it in a span with green styling.
    // We do this BEFORE restoring code blocks to avoid matching lines inside them.
    const lines = processed.split('\n');
    processed = lines.map(line => {
      // Imageboard behavior: '>' must be at the very start of the line (or after our space padding)
      const trimmedLine = line.replace(/^\u00A0+/, '');
      if (trimmedLine.startsWith('>') && !trimmedLine.startsWith('>>>')) {
        return `<span class="text-[#789922] dark:text-[#B5BD68] greentext">${line}</span>`;
      }
      return line;
    }).join('\n');

    // 4. Fix multiline wrapping for TextB/TextItalic/Strike
    processed = processed.replace(/(\*\*\*|\*\*|\*|___|__|~~|_)([\s\S]+?)\1/g, (match, sep, inner) => {
      if (inner.includes('\n')) {
        return `${sep}\u200B${inner}\u200B${sep}`;
      }
      return match;
    });

    // 5. Restore Code Blocks
    processed = processed.replace(/__BLOCK_CODE_(\d+)__/g, (match, p1) => {
      return `\n\n${blockCodes[parseInt(p1, 10)]}\n\n`;
    });

    // 6. Restore Mentions (Last step so markdown doesn't mess with (_) or other chars in links)
    processed = processed.replace(/__MENTION_BLOCK_(\d+)__/g, (match, p1) => {
      return mentionBlocks[parseInt(p1, 10)];
    });

    return processed;
  };

  const { customEmojis } = useEmojis();
  const emojiMeta = useMemo(() => customEmojis.map(e => ({ name: e.shortcode, url: e.url })), [customEmojis]);

  const renderContent = (content: string) => {
    if (!content) return null;
    const viewContent = resolveMentionsForView(content, emojiMeta);

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw]}
        components={{
          ...markdownComponents,
          pre: ({ children }: any) => {
            const codeElement = React.Children.only(children);
            const codeContent = String(codeElement.props.children).replace(/\n$/, "");

            return (
              <div className="group/code relative my-3 w-full max-w-full min-w-0 overflow-hidden rounded-xs border border-[#E1E1E1] dark:border-[#3D3D3D] bg-[#F8F8F8] dark:bg-[#2D2D2D]">
                {/* Code */}
                <pre className="relative overflow-x-auto p-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 min-w-0">
                  {/* Copy Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="
                    absolute right-3 top-3
                    h-7 w-7 rounded-md
                    border border-border/40
                    bg-background/70 backdrop-blur-sm
                    text-muted-foreground/60
                    opacity-0 transition-all duration-200
                    group-hover/code:opacity-100
                    hover:bg-black/5 hover:text-foreground
                    dark:hover:bg-white/5
                  "
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(codeContent);
                      toast.success("Kode disalin!");
                    }}
                  >
                    <Copy weight="duotone" className="h-3.5 w-3.5" />
                  </Button>

                  {children}
                </pre>
              </div>
            );
          },
          code: ({ node, className, children, ...props }: any) => {
            const isBlock = !!className;

            // Block code
            if (isBlock) {
              return (
                <code
                  className={cn(
                    "block whitespace-pre-wrap break-all md:whitespace-pre md:break-normal font-mono text-[12.5px] leading-relaxed text-[#1D1C1D] dark:text-[#D1D2D3]",
                    className
                  )}
                  {...props}
                >
                  {children}
                </code>
              );
            }

            // Inline code
            // Restore our multiline \n placeholder
            let inlineContent = children;
            if (typeof inlineContent === "string") {
              inlineContent = inlineContent.replace(/\uE000/g, "\n");
            } else if (Array.isArray(inlineContent)) {
              inlineContent = inlineContent.map((child: any) =>
                typeof child === "string" ? child.replace(/\uE000/g, "\n") : child
              );
            }

            return (
              <code
                className="
                mx-0.5 break-words whitespace-pre-wrap rounded-xs
                bg-[#F8F8F8] dark:bg-[#2D2D2D]
                px-[5px] py-[1.5px]
                font-mono text-[12px] font-medium
                text-[#E01E5A] dark:text-[#FF7B72]
              "
                {...props}
              >
                {inlineContent}
              </code>
            );
          },
        }}
      >
        {viewContent}
      </ReactMarkdown >
    );
  };

  const markdownComponents = {
    a: ({ node, href, children, ...props }: any) => {
      if (href?.startsWith('#mention:')) {
        const uid = href.replace('#mention:', '');

        if (uid === "everyone") {
          return (
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <span className="text-primary bg-primary/15 px-1 pb-0.5 pt-[1px] rounded-[4px] font-bold cursor-help">
                    {children}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="font-semibold text-xs py-1.5 px-3">
                  <p>Mentioning all users in this channel</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        const participant = roomData?.participants?.find((p: any) => p.user.id === uid);

        if (!participant) {
          return (
            <span
              className="text-primary bg-primary/15 px-1 pb-0.5 pt-[1px] rounded-[4px] font-bold cursor-default"
            >
              {children}
            </span>
          );
        }

        return (
          <ProfileHoverCard
            user={{
              id: participant.user.id,
              username: participant.user.username,
              avatar: participant.user.avatar,
              banner: participant.user.banner,
              bio: participant.user.bio,
              customStatus: participant.user.customStatus,
            }}
            isOnline={onlineUserIds.includes(participant.user.id)}
            currentUserId={currentUserId}
            onStartDM={handleStartDM}
          >
            <span
              className="text-primary bg-primary/15 hover:bg-primary/25 cursor-pointer px-1 pb-0.5 pt-[1px] rounded-[4px] font-bold transition-colors"
            >
              {children}
            </span>
          </ProfileHoverCard>
        );
      }
      return (
        <a
          {...props}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline break-all transition-colors font-semibold"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </a>
      );
    },
    p: ({ children }: any) => <p className="mb-1 last:mb-0 leading-relaxed text-[13.5px] whitespace-pre-wrap">{children}</p>,
    ul: ({ children }: any) => <ul className="list-disc ml-5 mb-0.5 mt-0.5 space-y-px [&_p]:m-0 [&_p]:inline">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal ml-5 mb-0.5 mt-0.5 space-y-px [&_p]:m-0 [&_p]:inline">{children}</ol>,
    li: ({ children }: any) => <li className="pl-1 leading-relaxed whitespace-pre-wrap">{children}</li>,
    h1: ({ children }: any) => <h1 className="text-lg font-black mt-4 mb-2 border-b border-border/30 pb-1 tracking-tight">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-base font-bold mt-3 mb-1.5 tracking-tight text-foreground/90">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-sm font-bold mt-2 mb-1 uppercase tracking-wider text-muted-foreground">{children}</h3>,
    hr: () => <hr className="my-4 border-border/20" />,
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-3 rounded-lg border border-border/50">
        <table className="w-full text-sm border-collapse">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => <thead className="bg-muted/50 border-b border-border/50">{children}</thead>,
    th: ({ children }: any) => <th className="px-4 py-2 text-left font-bold text-muted-foreground uppercase text-[11px] tracking-wider">{children}</th>,
    td: ({ children }: any) => <td className="px-4 py-2 border-b border-border/10">{children}</td>,
    strong: ({ children }: any) => <strong>{children}</strong>,
    em: ({ children }: any) => <em>{children}</em>,
    del: ({ children }: any) => <del>{children}</del>,
    img: ({ node, ...props }: any) => (
      <img 
          {...props} 
          className={cn(
              props.className,
              props.className?.includes('fediverse-emoji') && "inline-block h-[1.4em] w-[1.4em] align-text-bottom mx-0.5"
          )} 
      />
    )
  };

  const isOnline = onlineUserIds.includes(message.userId);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "relative group flex items-start gap-4 px-4 transition-all duration-300 ease-in-out cursor-default",
        isContinuation
          ? "pt-0"
          : cn("pt-2 hover:bg-muted/40 first:mt-0", isAfterSeparator ? "mt-1" : "mt-4"),
        isHovered && isContinuation && "bg-muted/30",
        isHighlighted && "bg-primary/10 ring-1 ring-primary/20 scale-[1.01] z-10",
        showMobileActions && isMobile && "bg-muted/40",
        isEditing && "bg-primary/5 ring-1 ring-primary/20"
      )}
      onClick={() => {
        if (isMobile && !isEditing) setShowMobileActions(!showMobileActions);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative pt-0.5 w-9 shrink-0 flex justify-center">
        {!isContinuation ? (
          <>
            <ProfileHoverCard
              user={{
                id: message.userId,
                username: message.user?.username || "Unknown",
                avatar: message.user?.avatar || "/avatars/avatar1.png",
                banner: message.user?.banner,
                bio: message.user?.bio,
                customStatus: message.user?.customStatus,
              }}
              isOnline={isOnline}
              currentUserId={currentUserId}
              onStartDM={handleStartDM}
            >
              <UserAvatar
                src={message.user?.avatar || "/avatars/avatar1.png"}
                alt={message.user?.username}
                className="w-9 h-9 rounded-md ring-1 ring-border/50 cursor-pointer"
              />
            </ProfileHoverCard>
            <div
              className={`h-2.5 w-2.5 ring-2 ring-background rounded-full absolute -bottom-0.5 -right-0.5 ${isOnline
                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                : "bg-muted-foreground/30"
                }`}
            ></div>
          </>
        ) : (
          <span className={cn(
            "text-[9px] text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-opacity mt-1.5 font-medium",
            isHovered && "opacity-100"
          )}>
            {formatTime(new Date(message.createdAt))}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {!isContinuation && (
          <div className="flex items-baseline gap-2">
            <ProfileHoverCard
              user={{
                id: message.userId,
                username: message.user?.username || "Unknown",
                avatar: message.user?.avatar || "/avatars/avatar1.png",
                banner: message.user?.banner,
                bio: message.user?.bio,
                customStatus: message.user?.customStatus,
              }}
              isOnline={isOnline}
              currentUserId={currentUserId}
              onStartDM={handleStartDM}
            >
              <span 
                className="cursor-pointer text-sm font-bold text-foreground hover:underline decoration-primary/50 underline-offset-2"
              >{message.user?.name || message.user?.username || "Unknown User"}</span>
            </ProfileHoverCard>

            <span className="text-[10px] font-medium text-muted-foreground/60">
              {formatTimestamp(new Date(message.createdAt))}
            </span>
          </div>
        )}

        {message.replyToMessage && (
          <div
            className="flex items-center gap-2 mt-0.5 mb-1 group/reply cursor-pointer hover:bg-primary/5 p-1 rounded-sm transition-colors border-l-2 border-primary/20 pl-2"
            onClick={() => message.replyTo && onScrollToMessage?.(message.replyTo)}
          >
            <ArrowBendUpLeft weight="duotone" className="h-3 w-3 text-primary/60" />
            <div className="text-[11px] text-muted-foreground line-clamp-1">
              <span 
                className="font-bold text-primary/70"
              >{message.replyToMessage.user?.name || message.replyToMessage.user?.username || "user"}</span>
              <span className="ml-1 opacity-80 italic">
                {truncate(
                  message.replyToMessage.content?.replace(/<@([a-zA-Z0-9_-]+)>/g, (match, uid) => {
                    if (uid === "everyone") return "@everyone";
                    const p = roomData?.participants?.find((p: any) => p.user.id === uid);
                    return p ? `@${p.user.username}` : `@${uid}`;
                  }) || "",
                  60
                )}
              </span>
            </div>
          </div>
        )}

        {/* === INLINE EDIT MODE === */}
        {isEditing ? (
          <div className="mt-1 mb-1">
            <div className="relative group/edit-input">
              <MentionTextarea
                value={editContent}
                onChange={(val) => setEditContent(val)}
                onSubmit={handleSaveEdit}
                onKeyDown={handleEditKeyDown}
                className="w-full bg-background border border-primary/30 rounded-lg focus-within:ring-2 focus-within:ring-primary/40 min-h-[40px] max-h-[300px] pr-10"
                maxHeight={300}
                roomData={roomData!}
                currentUserId={currentUserId}
                autoFocus
              />
              <div className="absolute right-2 bottom-2">
                <EmojiPickerComponent
                  onEmojiSelect={(emoji) => setEditContent((prev) => prev + emoji)}
                  triggerClassName="h-7 w-7 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all flex items-center justify-center"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] text-muted-foreground">
                escape untuk <button onClick={onCancelEdit} className="text-primary hover:underline font-medium">membatalkan</button>
                {" "}&bull;{" "}
                enter untuk <button onClick={handleSaveEdit} className="text-primary hover:underline font-medium">menyimpan</button>
              </span>
            </div>
          </div>
        ) : (
          /* === NORMAL VIEW MODE === */
          <>
            {message.content && (
              <div className="flex items-baseline gap-1.5 flex-wrap w-full min-w-0">
                <div
                  className={cn(
                    "leading-relaxed text-foreground/90 mt-0.5 break-words min-w-0 w-full max-w-full",
                    isOnlyEmoji(message.content) ? "text-5xl leading-none" : "text-[13.5px]",
                    "pr-10"
                  )}
                >
                  {renderContent(message.content)}
                </div>
                {isEdited && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-[10px] text-muted-foreground/50 cursor-default select-none hover:text-muted-foreground/80 transition-colors">
                        (edited)
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-[10px] font-medium py-1 px-2">
                      <p>{formatEditedTime(new Date(message.updatedAt))}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}
          </>
        )}

        {/* Reactions Section */}
        {groupedReactions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mt-2 mb-1 animate-in fade-in zoom-in-95 duration-200">
            {groupedReactions.map((group) => (
              <TooltipProvider key={group.emoji}>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleReaction(group.emoji); }}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all border select-none active:scale-95 hover:scale-105 shadow-sm duration-150 ease-out",
                        group.hasReacted
                          ? "bg-primary/15 border-primary/45 text-primary shadow-md shadow-primary/5 ring-1 ring-primary/30"
                          : "bg-muted/40 border-border/80 hover:bg-muted/70 hover:border-muted-foreground/30 text-muted-foreground"
                      )}
                    >
                      <span 
                        className="text-base leading-none flex items-center justify-center min-w-[18px] min-h-[18px] transform hover:scale-115 transition-transform duration-100"
                      >{group.emoji}</span>
                      <span className={cn("font-bold tabular-nums text-[11px]", group.hasReacted ? "text-primary" : "text-muted-foreground/70")}>
                        {group.count}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-[220px] rounded-lg border-0 bg-zinc-900 dark:bg-zinc-100 shadow-2xl px-3 py-2"
                  >
                    <div className="flex flex-col gap-2 items-center">
                      <span 
                        className="text-3xl leading-none flex items-center justify-center p-1"
                      >{group.emoji}</span>
                      <p className="text-[11px] font-medium leading-snug text-zinc-100 dark:text-zinc-900 text-center">
                        <span className="font-bold">{group.users.join(", ")}</span>
                        {" "}bereaksi
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}

            {/* Add Reaction button — visible only on hover, Discord/Slack style */}
            <div
              className={cn(
                "transition-all duration-200",
                isHovered ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <EmojiPickerComponent
                onEmojiSelect={handleToggleReaction}
                triggerClassName="h-6 w-6 rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground/60 hover:border-primary/50 hover:text-primary hover:bg-primary/10 transition-all"
                triggerSize="sm"
              />
            </div>
          </div>
        )}

        {socialEmbeds.length > 0 && (
          <div className="flex flex-col gap-1">
            {socialEmbeds}
          </div>
        )}

        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-col gap-2 mt-2 max-w-[500px]">
            {imagesAndVideos.length > 0 && (
              <div className={cn(
                "grid gap-1 overflow-hidden rounded-xl border border-border/50 bg-muted/20 shadow-sm",
                imagesAndVideos.length === 1 && "grid-cols-1 max-w-sm",
                imagesAndVideos.length === 2 && "grid-cols-2",
                imagesAndVideos.length >= 3 && "grid-cols-2",
              )}>
                {imagesAndVideos.slice(0, 4).map((item, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "relative group-media cursor-zoom-in overflow-hidden aspect-square sm:aspect-auto bg-muted/30",
                      imagesAndVideos.length === 1 ? "aspect-auto min-h-[200px] max-h-[450px]" : "aspect-[4/3]",
                      imagesAndVideos.length === 3 && idx === 0 && "col-span-2 aspect-[2/1]",
                    )}
                    onClick={(e) => { e.stopPropagation(); openLightbox(idx); }}
                  >
                    {item.type === 'video' ? (
                      <div className="w-full h-full relative">
                        <video
                          src={item.url}
                          className="w-full h-full object-cover"
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-media:hover:bg-black/40 transition-colors">
                          <div className="bg-primary/80 rounded-full p-3 shadow-xl transform transition-transform group-media:hover:scale-110">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.841z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt={item.filename}
                        className="w-full h-full object-cover transition-transform duration-500 group-media:hover:scale-110"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-media:hover:bg-black/20 transition-colors flex items-center justify-center">
                      <ArrowSquareOut weight="duotone" className="w-8 h-8 text-white opacity-0 group-media:hover:opacity-100 transition-all scale-75 group-media:hover:scale-100 drop-shadow-lg" />
                    </div>
                    {imagesAndVideos.length > 4 && idx === 3 && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="text-white text-xl font-bold">+{imagesAndVideos.length - 4}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {otherFiles.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {otherFiles.map((attachment) => (
                  <div key={attachment.id} className="group flex items-center gap-3 p-2.5 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-all hover:shadow-md max-w-sm">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <File weight="duotone" className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate text-foreground/90">{getFileName(attachment.url)}</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                        {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : "Attachment"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary" onClick={(e) => e.stopPropagation()}>
                        <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                          <ArrowSquareOut weight="duotone" className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary" onClick={(e) => e.stopPropagation()}>
                        <a href={attachment.url} download={getFileName(attachment.url)}>
                          <DownloadSimple weight="duotone" className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions Bar - Tap to Reveal on Mobile / Hover on Desktop */}
        {!isEditing && (
          <div
            className={cn(
              "absolute -top-3 right-4 transition-all duration-300 transform z-10",
              isMobile
                ? (showMobileActions
                  ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                  : "opacity-0 translate-y-2 scale-95 pointer-events-none")
                : "opacity-0 md:opacity-0 md:group-hover:opacity-100 md:translate-y-1 md:group-hover:translate-y-0"
            )}
            onClick={(e) => isMobile && e.stopPropagation()}
          >
            <div className="flex items-center gap-1 bg-background/80 backdrop-blur-md shadow-lg border border-border/40 rounded-lg p-0.5 ring-1 ring-black/5">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); onReply(message); }}
                      className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <ArrowBendUpLeft className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="text-[10px] font-bold py-1 px-2"
                  >
                    <p>Reply</p>
                  </TooltipContent>
                </Tooltip>
                <EmojiPickerComponent onEmojiSelect={handleToggleReaction} />

                {message.userId === currentUserId && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartEdit(message);
                          }}
                          className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <PencilSimple weight="duotone" className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="text-[10px] font-bold py-1 px-2"
                      >
                        <p>Edit</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isDeleting}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash weight="duotone" className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Pesan?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tindakan ini tidak dapat dibatalkan. Pesan akan dihapus untuk semua orang.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="text-[10px] font-bold py-1 px-2"
                      >
                        <p>Delete</p>
                      </TooltipContent>
                    </Tooltip>
                  </>
                )}
              </TooltipProvider>
            </div>
          </div>
        )}
      </div>

      <ImageLightbox
        images={imagesAndVideos as any}
        initialIndex={initialImageIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </div>
  );
}
