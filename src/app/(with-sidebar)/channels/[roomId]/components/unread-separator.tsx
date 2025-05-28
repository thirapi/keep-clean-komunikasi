export function UnreadSeparator() {
  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center flex-1">
        <div className="flex-grow h-px bg-red-500" />
      </div>
      <div className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-semibold rounded-full">
        NEW
      </div>
    </div>
  );
}
