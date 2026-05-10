import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";

type Variant = "success" | "error" | "warning" | "info";

interface AlertProps {
  variant?: Variant;
  message?: string | null;
  className?: string;
}

const config: Record<Variant, { icon: React.ReactNode; cls: string }> = {
  success: {
    icon: <CheckCircle2 size={15} className="shrink-0 mt-0.5" />,
    cls: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  },
  error: {
    icon: <XCircle size={15} className="shrink-0 mt-0.5" />,
    cls: "bg-red-50 text-red-700 border border-red-200",
  },
  warning: {
    icon: <AlertCircle size={15} className="shrink-0 mt-0.5" />,
    cls: "bg-amber-50 text-amber-800 border border-amber-200",
  },
  info: {
    icon: <Info size={15} className="shrink-0 mt-0.5" />,
    cls: "bg-blue-50 text-blue-700 border border-blue-200",
  },
};

export function Alert({ variant = "info", message, className = "" }: AlertProps) {
  if (!message) return null;
  const { icon, cls } = config[variant];
  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-sm leading-snug ${cls} ${className}`}
    >
      {icon}
      <span>{message}</span>
    </div>
  );
}
