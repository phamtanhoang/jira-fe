import { cn } from "@/lib/utils";

/**
 * Shared header row for admin data tables.
 *
 * Wraps children in the standard `bg-muted/40 tracking-wider` header bar
 * so every admin table has a consistent look without repeating the class
 * string. Pass a `gridCols` Tailwind class to control column widths.
 *
 * @example
 * <AdminTableHeader gridCols="grid-cols-[2fr_1fr_1fr_auto]">
 *   <span>Name</span>
 *   <span>Role</span>
 *   <span>Status</span>
 *   <span className="text-right">Actions</span>
 * </AdminTableHeader>
 */
export function AdminTableHeader({
  gridCols,
  className,
  children,
}: {
  /** Tailwind `grid-cols-[...]` class that controls column widths. */
  gridCols: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid gap-2 border-b bg-muted/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
        gridCols,
        className,
      )}
    >
      {children}
    </div>
  );
}
