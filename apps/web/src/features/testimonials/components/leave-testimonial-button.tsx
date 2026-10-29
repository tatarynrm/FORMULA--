'use client';

import { Button } from '@/components/ui/button';

import { LeaveTestimonialDialog } from './leave-testimonial-dialog';

/** The "Залишити відгук" button of the landing page (a client island in a server section). */
export function LeaveTestimonialButton({ label }: { label: string }) {
  return (
    <LeaveTestimonialDialog>
      <Button type="button" className="self-start">
        {label}
      </Button>
    </LeaveTestimonialDialog>
  );
}
