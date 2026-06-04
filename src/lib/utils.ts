import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNowStrict } from "date-fns"
import { id } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date: Date, isMobile: boolean = false) {
    if (!isMobile) {
        // Standard behavior
        return formatDistanceToNowStrict(date, { addSuffix: true, locale: id });
    }

    // Shortened for mobile: "12j", "5m", etc.
    const distance = formatDistanceToNowStrict(date, { locale: id });
    
    // date-fns strict output format examples: "12 jam", "5 menit", "1 detik", "2 hari", "1 minggu", "1 bulan", "1 tahun"
    return distance
        .replace(" jam", "j")
        .replace(" menit", "m")
        .replace(" detik", "d")
        .replace(" hari", "h")
        .replace(" minggu", "mg")
        .replace(" bulan", "bln")
        .replace(" tahun", "th")
        .replace(" sekitar", "");
}
