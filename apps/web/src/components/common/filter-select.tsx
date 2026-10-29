import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterSelectProps {
  id: string;
  label: string;
  options: readonly string[];
}

/** Labelled pill dropdown used by the filter rows (category, year, specialty). */
export function FilterSelect({ id, label, options }: FilterSelectProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <label htmlFor={id} className="text-body-md text-input-placeholder">
        {label}
      </label>
      <Select defaultValue={options[0]}>
        <SelectTrigger
          id={id}
          className="bg-surface-raised border-input text-body-md text-input-placeholder w-full rounded-full px-4 shadow-none data-[size=default]:h-12"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
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
