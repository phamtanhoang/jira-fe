/**
 * Lấy chữ cái đầu tiên (viết hoa) làm avatar initials.
 * Ưu tiên name, fallback về email, cuối cùng là "?".
 */
export function getInitials(name?: string | null, email?: string | null): string {
  const source = name || email || "?";
  return source.charAt(0).toUpperCase();
}

/**
 * Format ngày ngắn: "Apr 11"
 */
export function formatDateShort(date: string | Date): string {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/**
 * Format ngày đầy đủ: "Apr 11, 2026"
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format ngày + giờ: "Apr 11, 14:30"
 */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Toggle phần tử trong mảng: thêm nếu chưa có, xóa nếu đã có.
 */
export function toggleArrayItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((v) => v !== item) : [...arr, item];
}
