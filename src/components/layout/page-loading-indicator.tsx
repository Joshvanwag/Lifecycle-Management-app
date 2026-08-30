interface PageLoadingIndicatorProps {
  label?: string;
}

export function PageLoadingIndicator({ label = "Loading" }: PageLoadingIndicatorProps) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/25 border-t-primary"
        aria-hidden
      />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
