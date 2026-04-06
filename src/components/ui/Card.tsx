import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn(
      "bg-white border border-slate-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,.08)]",
      className
    )}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between px-5 py-4 border-b border-slate-100", className)}>
      <div>
        <div className="text-[15px] font-semibold text-slate-800">{title}</div>
        {subtitle && <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ children, className }: CardProps) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

export function CardFooter({ children, className }: CardProps) {
  return (
    <div className={cn("px-5 py-3 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex items-center gap-2", className)}>
      {children}
    </div>
  );
}
