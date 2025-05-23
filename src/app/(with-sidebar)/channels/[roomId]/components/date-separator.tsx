export function DateSeparator({ date }: { date: Date }) {
  const formattedDate = date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex items-center justify-center">
      <hr className="flex-grow border-t border-gray-700" />
      <span className="mx-4 text-sm text-gray-400 whitespace-nowrap">
        {formattedDate}
      </span>
      <hr className="flex-grow border-t border-gray-700" />
    </div>
  );
}
