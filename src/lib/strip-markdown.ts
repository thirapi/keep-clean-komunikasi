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
