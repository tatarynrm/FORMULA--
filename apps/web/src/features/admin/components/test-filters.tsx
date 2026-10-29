'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { t } from '@/locales';

/** Select value that means "no filter". Radix selects cannot have an empty string as a value. */
export const ALL_FILTER = '__all__';

interface FilterFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}

/** Labelled pill dropdown of the filter row (Figma "filters"), with an "Усі" entry first. */
export function FilterField({ id, label, value, onChange, options }: FilterFieldProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <label htmlFor={id} className="text-body-md text-input-placeholder">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id={id}
          className="bg-surface-raised border-input text-body-md text-input-placeholder w-full rounded-full px-4 shadow-none data-[size=default]:h-12"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_FILTER}>{t.adminContent.tests.filters.all}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
