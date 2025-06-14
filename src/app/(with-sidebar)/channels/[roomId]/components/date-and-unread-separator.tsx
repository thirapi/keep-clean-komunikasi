export function DateAndUnreadSeparator({ date }: { date: Date }) {
  const formattedDate = date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex items-center justify-between px-4 py-2">
      <div className="flex items-center flex-1">
        <div className="flex-grow h-px bg-destructive/50" />
        <span className="mx-4 text-sm text-destructive whitespace-nowrap">
          {formattedDate}
        </span>
        <div className="flex-grow h-px bg-destructive/50" />
      </div>
      <span className="ml-2 px-2 py-0.5 bg-destructive text-destructive-foreground text-[10px] font-semibold rounded-full">
        NEW
      </span>
    </div>
  );
}
