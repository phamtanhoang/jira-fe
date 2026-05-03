import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type DeliveryStatus = "SUCCESS" | "FAILED" | "PENDING";

const STATUS_CLASSES: Record<DeliveryStatus, string> = {
  SUCCESS:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  FAILED: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

const STATUS_ICONS: Record<DeliveryStatus, React.ElementType | null> = {
  SUCCESS: CheckCircle2,
  FAILED: XCircle,
  PENDING: Clock,
};

/**
 * Reusable status badge for webhook deliveries, mail logs, and similar
 * SUCCESS / FAILED / PENDING states. Renders a coloured badge with an
 * icon prefix and an optional numeric status code suffix.
 */
export function StatusBadge({
  status,
  statusCode,
}: {
  status: DeliveryStatus;
  /** Optional HTTP status code shown after the label (e.g. 200, 500). */
  statusCode?: number | null;
}) {
  const Icon = STATUS_ICONS[status];

  return (
    <Badge variant="secondary" className={STATUS_CLASSES[status]}>
      {Icon && <Icon className="mr-1 h-3 w-3" />}
      {status}
      {statusCode != null && statusCode > 0 && (
        <span className="ml-1 tabular-nums">{statusCode}</span>
      )}
    </Badge>
  );
}
