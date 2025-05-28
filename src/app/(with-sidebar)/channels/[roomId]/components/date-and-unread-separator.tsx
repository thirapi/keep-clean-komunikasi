export function DateAndUnreadSeparator({ date }: { date: Date }) {
  const formattedDate = date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center flex-1">
        <div className="flex-grow h-px bg-red-500" />
        <span className="mx-4 text-sm text-red-500 whitespace-nowrap">
          {formattedDate}
        </span>
        <div className="flex-grow h-px bg-red-500" />
      </div>
      <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-[10px] font-semibold rounded-full">
        NEW
      </span>
    </div>
  );
}