import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  dot?: string; // Tailwind color class for the dot
}

export function Badge({ children, className, dot }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap",
      className
    )}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dot)} />}
      {children}
    </span>
  );
}
