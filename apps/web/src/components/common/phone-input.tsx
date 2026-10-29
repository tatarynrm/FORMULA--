'use client';

import { UA_PHONE_EXAMPLE, formatUkrainianPhoneInput } from '@formula/shared';
import type { ComponentProps } from 'react';

import { Input } from '@/components/ui/input';

type PhoneInputProps = Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> & {
  /** Always written as `+380 98 938 55 85` as far as the digits go; `''` when empty. */
  value: string;
  onChange: (value: string) => void;
};

/**
 * A Ukrainian phone field. Whatever is typed or pasted (`0989385585`, `380989385585`,
 * `+380 (98) 938-55-85`) turns into `+380 98 938 55 85` right away, so the form never holds
 * another shape. There is no `maxLength` on purpose: a pasted number with brackets and dashes is
 * longer than the shaped one, and the formatter cuts the digits itself.
 */
export function PhoneInput({ value, onChange, ...props }: PhoneInputProps) {
  return (
    <Input
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      placeholder={UA_PHONE_EXAMPLE}
      value={value}
      onChange={(event) => onChange(formatUkrainianPhoneInput(event.target.value))}
      {...props}
    />
  );
}
