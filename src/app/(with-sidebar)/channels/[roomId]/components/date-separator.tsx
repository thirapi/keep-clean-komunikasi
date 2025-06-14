export function DateSeparator({ date }: { date: Date }) {
  const formattedDate = date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex items-center justify-center px-4 py-2">
      <hr className="flex-grow border-t border-border" />
      <span className="mx-4 text-sm text-muted-foreground whitespace-nowrap">
        {formattedDate}
      </span>
      <hr className="flex-grow border-t border-border" />
    </div>
  );
}
