import { cn } from '@/lib/utils';

interface StatCardProps {
  value: string;
  label: string;
  /** Optional muted suffix next to the value, e.g. "/36". */
  suffix?: string;
  /** The first card on the dashboard is filled with the page color instead of being outlined. */
  highlighted?: boolean;
  className?: string;
}

export function StatCard({ value, label, suffix, highlighted = false, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'flex min-h-27.5 flex-col gap-2 rounded-2xl p-4',
        highlighted ? 'bg-background' : 'bg-surface-raised border-input border',
        className,
      )}
    >
      <p className="text-metric text-foreground">
        {value}
        {suffix ? (
          <span className="text-body-md text-muted-foreground font-medium">{suffix}</span>
        ) : null}
      </p>
      <p
        className={cn(
          'text-body-xs font-medium',
          highlighted ? 'text-text-secondary' : 'text-muted-foreground',
        )}
      >
        {label}
      </p>
    </div>
  );
}
