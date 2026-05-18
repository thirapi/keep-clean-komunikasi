import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string) {
  if (!name) return "?";
  const nameParts = name.split(" ");
  const initials = nameParts
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return initials.length <= 2 ? initials : initials.substring(0, 2);
}

export function stripMarkdown(content?: string) {
  if (!content) return "";
  return content
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, "[Kode]")
    // Remove bold, italic, strike
    .replace(/(\*\*\*|\*\*|\*|___|__|~~|_)([\s\S]+?)\1/g, "$2")
    // Remove inline code
    .replace(/`([^`]+)`/g, "$1")
    // Replace newlines with spaces
    .replace(/\n+/g, " ")
    // Cleanup mentions (basic)
    .replace(/<@everyone>/g, "@everyone")
    .replace(/<@([a-zA-Z0-9_-]+)>/g, "@pengguna")
    .trim();
}
