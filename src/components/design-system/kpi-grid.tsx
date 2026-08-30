import { cn } from "@/lib/utils";

export function KpiGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7", className)}>
      {children}
    </div>
  );
}
