import { cx } from "@/lib/theme";

type BadgeVariant = "gray" | "indigo" | "green" | "red" | "amber";

const variantMap: Record<BadgeVariant, string> = {
  gray: cx.badgeGray,
  indigo: cx.badgeIndigo,
  green: cx.badgeGreen,
  red: cx.badgeRed,
  amber: cx.badgeAmber,
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "gray", children, className = "" }: BadgeProps) {
  return (
    <span className={[variantMap[variant], className].filter(Boolean).join(" ")}>
      {children}
    </span>
  );
}
