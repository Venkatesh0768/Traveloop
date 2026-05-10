import { cx } from "@/lib/theme";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className = "", padding = true }: CardProps) {
  return (
    <div className={[cx.card, padding ? cx.cardPadding : "", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

export function CardHeader({ icon, title, description }: CardHeaderProps) {
  return (
    <div className={cx.sectionHeader}>
      {icon && (
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
          {icon}
        </div>
      )}
      <div>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}
