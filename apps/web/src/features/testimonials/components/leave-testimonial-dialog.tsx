'use client';

import { type ReactNode, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { t } from '@/locales';

import { TestimonialForm } from './testimonial-form';

/** Opens the testimonial form in a modal. `children` is the button that opens it. */
export function LeaveTestimonialDialog({ children }: { children: ReactNode }) {
  const copy = t.testimonials.form;
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.dialogTitle}</DialogTitle>
          <DialogDescription>{copy.dialogDescription}</DialogDescription>
        </DialogHeader>
        {/* The content unmounts on close, so the next opening starts with a clean form. */}
        <TestimonialForm onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
