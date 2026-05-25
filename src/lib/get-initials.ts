export function getInitials(name: string) {
  if (!name) return "?";
  const nameParts = name.split(" ");
  const initials = nameParts
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return initials.length <= 2 ? initials : initials.substring(0, 2);
}
