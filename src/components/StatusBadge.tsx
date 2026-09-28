import type { InvoiceStatus } from "@/lib/types";
import { localDate } from "@/lib/dates";

export function isOverdue(dueDate: string, status: InvoiceStatus) {
  return status !== "paid" && dueDate < localDate();
}

export function StatusBadge({ status, dueDate }: { status: InvoiceStatus; dueDate: string }) {
  const overdue = isOverdue(dueDate, status);
  const style =
    status === "paid"
      ? "bg-ok-soft text-ok"
      : status === "underpaid" || overdue
        ? "bg-warn-soft text-warn"
        : "bg-accent-soft text-accent";
  const text = status === "paid" ? "Paid" : status === "underpaid" ? "Underpaid" : overdue ? "Overdue" : "Open";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{text}</span>;
}
