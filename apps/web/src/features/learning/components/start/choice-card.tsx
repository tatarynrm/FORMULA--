import { cn } from '@/lib/utils';

interface ChoiceCardProps {
  /** Radios with the same name form one group. */
  name: string;
  checked: boolean;
  onSelect: () => void;
  title: string;
  hint: string;
  disabled?: boolean;
}

/**
 * A big radio option with a title and a hint (Figma "test settings"). It is a real radio input, so the
 * browser provides the keyboard behavior (arrows move and select) and screen readers read the group.
 */
export function ChoiceCard({ name, checked, onSelect, title, hint, disabled }: ChoiceCardProps) {
  return (
    <label
      className={cn(
        'group bg-secondary flex cursor-pointer items-start gap-3 rounded-2xl border border-transparent p-4 transition-colors',
        'has-checked:border-answer-border has-checked:bg-accent',
        'has-focus-visible:ring-ring has-focus-visible:ring-[3px]',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        aria-hidden
        className="border-primary bg-surface-raised mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2"
      >
        <span className="bg-primary size-2.5 rounded-full opacity-0 transition-opacity group-has-checked:opacity-100" />
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-body-md text-foreground font-semibold">{title}</span>
        <span className="text-body-sm text-muted-foreground">{hint}</span>
      </span>
    </label>
  );
}
