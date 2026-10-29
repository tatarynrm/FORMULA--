'use client';

import type { AdminTestimonial, TestimonialStatus } from '@formula/shared';
import { Check, Pencil, Trash2, Undo2, X } from 'lucide-react';
import { useState } from 'react';

import { UserAvatar } from '@/components/common/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/features/admin/components/confirm-dialog';
import { format, formatRelativeTime } from '@/lib/format';
import { t } from '@/locales';

import { useDeleteTestimonial, useUpdateTestimonial } from '../hooks/use-testimonials';
import { EditTestimonialDialog } from './edit-testimonial-dialog';
import { RatingStars } from './rating-stars';

interface AdminTestimonialCardProps {
  testimonial: AdminTestimonial;
  /** Time source for the relative dates, so an open list keeps them honest. */
  now: number;
}

/** One testimonial in the moderation list: who wrote it, the text, and what the admin can do. */
export function AdminTestimonialCard({ testimonial, now }: AdminTestimonialCardProps) {
  const copy = t.testimonials.admin;
  const update = useUpdateTestimonial();
  const remove = useDeleteTestimonial();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [failed, setFailed] = useState(false);

  const fullName = `${testimonial.name} ${testimonial.surname}`.trim();
  const busy = update.isPending || remove.isPending;

  function setStatus(status: TestimonialStatus) {
    setFailed(false);
    update.mutate({ id: testimonial.id, input: { status } }, { onError: () => setFailed(true) });
  }

  return (
    <article className="bg-surface-raised border-border flex flex-col gap-4 rounded-2xl border p-5">
      <header className="flex items-start gap-3">
        <UserAvatar name={testimonial.name} fileId={testimonial.avatarFileId} size="md" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-body-md text-foreground truncate font-bold">{fullName}</p>
          <p className="text-body-xs text-muted-foreground flex flex-wrap gap-x-2">
            {testimonial.email ? (
              <a
                href={`mailto:${testimonial.email}`}
                className="hover:text-primary truncate transition-colors"
              >
                {testimonial.email}
              </a>
            ) : (
              <span>{copy.noEmail}</span>
            )}
            {testimonial.phone ? (
              <a
                href={`tel:${testimonial.phone.replace(/\s/g, '')}`}
                className="hover:text-primary whitespace-nowrap transition-colors"
              >
                {testimonial.phone}
              </a>
            ) : null}
            <span>{formatRelativeTime(testimonial.createdAt, now)}</span>
          </p>
        </div>
        <RatingStars value={testimonial.rating} />
      </header>

      <p className="text-body-md text-foreground break-words whitespace-pre-line">
        {testimonial.text}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={testimonial.author ? 'secondary' : 'outline'}>
          {testimonial.author ? copy.registered : copy.guest}
        </Badge>
        {testimonial.editedAt ? <Badge variant="outline">{copy.edited}</Badge> : null}
        {testimonial.moderatedAt && testimonial.moderatedBy ? (
          <span className="text-body-xs text-muted-foreground">
            {format(copy.decided, {
              name: testimonial.moderatedBy.name,
              date: formatRelativeTime(testimonial.moderatedAt, now),
            })}
          </span>
        ) : null}
      </div>

      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label={copy.actions.label}
      >
        {testimonial.status !== 'approved' ? (
          <Button type="button" size="sm" disabled={busy} onClick={() => setStatus('approved')}>
            <Check />
            {copy.actions.approve}
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => setStatus('pending')}
          >
            <Undo2 />
            {copy.actions.unpublish}
          </Button>
        )}
        {testimonial.status === 'pending' ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => setStatus('rejected')}
          >
            <X />
            {copy.actions.reject}
          </Button>
        ) : null}
        {testimonial.status === 'rejected' ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => setStatus('pending')}
          >
            <Undo2 />
            {copy.actions.restore}
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() => setEditing(true)}
        >
          <Pencil />
          {copy.actions.edit}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-destructive ml-auto"
          disabled={busy}
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 />
          {copy.actions.delete}
        </Button>
      </div>

      {failed || remove.isError ? (
        <p role="alert" className="text-body-sm text-destructive">
          {remove.isError ? copy.deleteError : copy.actionError}
        </p>
      ) : null}

      {editing ? (
        <EditTestimonialDialog testimonial={testimonial} onClose={() => setEditing(false)} />
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={copy.deleteTitle}
        description={format(copy.deleteDescription, { name: fullName })}
        confirmLabel={copy.actions.delete}
        onConfirm={() => remove.mutate(testimonial.id)}
      />
    </article>
  );
}
