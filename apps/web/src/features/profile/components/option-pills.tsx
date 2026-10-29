'use client';

import { cn } from '@/lib/utils';

interface OptionPillsProps {
  label: string;
  options: readonly { code: string; label: string }[];
  value: string | null;
  onChange: (code: string | null) => void;
}

/** Single-choice pills. Clicking the selected pill clears the choice, so every field stays optional. */
export function OptionPills({ label, options, value, onChange }: OptionPillsProps) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = option.code === value;

        return (
          <button
            key={option.code}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(selected ? null : option.code)}
            className={cn(
              'text-body-md rounded-full border px-5 py-2.5 font-medium transition-colors',
              selected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-surface-raised text-text-secondary hover:border-primary hover:text-primary',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
