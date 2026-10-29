import type { LucideIcon } from 'lucide-react';

interface CountChipProps {
  icon: LucideIcon;
  /** What is counted ("Матеріали"). Shown as a tooltip and read by screen readers. */
  label: string;
  count: number;
}

/** Small "icon + number" counter used in the meta line of content rows. */
export function CountChip({ icon: Icon, label, count }: CountChipProps) {
  return (
    <span className="flex items-center gap-1.5" title={label}>
      <Icon className="size-4" aria-hidden />
      <span className="sr-only">{label}: </span>
      {count}
    </span>
  );
}
