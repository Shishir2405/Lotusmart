import { cn } from "@/utils/helpers";

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral" | "primary" | "secondary";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  error: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  neutral: "bg-neutral-100 text-neutral-600 border-neutral-200",
  primary: "bg-[#FFF1F3] text-[#E84672] border-[#FFC2D1]",
  secondary: "bg-[#F7F6F0] text-[#7A6E42] border-[#D4CFB3]",
};

const dotColors: Record<BadgeVariant, string> = {
  success: "bg-green-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  info: "bg-blue-500",
  neutral: "bg-neutral-400",
  primary: "bg-[#E84672]",
  secondary: "bg-[#7A6E42]",
};

export function Badge({ children, variant = "neutral", className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variantClasses[variant],
        className,
      )}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", dotColors[variant])} />}
      {children}
    </span>
  );
}


const orderStatusMap: Record<string, BadgeVariant> = {
  placed: "info",
  confirmed: "secondary",
  processing: "warning",
  shipped: "primary",
  delivered: "success",
  cancelled: "error",
  returned: "neutral",
};

export function OrderStatusBadge({ status }: { status: string }) {
  const variant = orderStatusMap[status] ?? "neutral";
  return (
    <Badge variant={variant} dot>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    paid: "success",
    pending: "warning",
    failed: "error",
    refunded: "info",
  };
  return (
    <Badge variant={map[status] ?? "neutral"} dot>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
