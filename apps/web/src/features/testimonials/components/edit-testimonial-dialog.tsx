'use client';

import { type AdminTestimonial, TESTIMONIALS } from '@formula/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { PhoneInput } from '@/components/common/phone-input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format } from '@/lib/format';
import { t } from '@/locales';

import { useUpdateTestimonial } from '../hooks/use-testimonials';
import { type EditTestimonialFormValues, editTestimonialFormSchema } from '../schemas';
import { RatingInput } from './rating-input';

interface EditTestimonialDialogProps {
  testimonial: AdminTestimonial;
  onClose: () => void;
}

/** Fix the wording or the signature of a testimonial; it can be published in the same step. */
export function EditTestimonialDialog({ testimonial, onClose }: EditTestimonialDialogProps) {
  const copy = t.testimonials.admin.edit;
  const update = useUpdateTestimonial();
  const [error, setError] = useState(false);

  const form = useForm<EditTestimonialFormValues>({
    resolver: zodResolver(editTestimonialFormSchema),
    defaultValues: {
      name: testimonial.name,
      surname: testimonial.surname,
      email: testimonial.email,
      phone: testimonial.phone ?? '',
      rating: testimonial.rating,
      text: testimonial.text,
    },
  });
  const typed = useWatch({ control: form.control, name: 'text' });

  function save(publish: boolean) {
    void form.handleSubmit((values) => {
      setError(false);
      update.mutate(
        {
          id: testimonial.id,
          input: {
            name: values.name,
            surname: values.surname,
            text: values.text,
            rating: values.rating,
            // Empty keeps the email (an old testimonial may have none); an empty phone removes it.
            ...(values.email ? { email: values.email } : {}),
            phone: values.phone === '' ? null : values.phone,
            ...(publish ? { status: 'approved' as const } : {}),
          },
        },
        { onSuccess: onClose, onError: () => setError(true) },
      );
    })();
  }

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              save(false);
            }}
            className="flex flex-col gap-4"
            noValidate
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{copy.name}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="surname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{copy.surname}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{copy.email}</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{copy.phone}</FormLabel>
                    <FormControl>
                      <PhoneInput
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="rating"
              render={({ field, fieldState }) => (
                <FormItem>
                  <span id="edit-testimonial-rating" className="text-body-md font-medium">
                    {copy.rating}
                  </span>
                  <RatingInput
                    value={field.value}
                    onChange={field.onChange}
                    labelledBy="edit-testimonial-rating"
                    invalid={fieldState.invalid}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{copy.text}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={6}
                      maxLength={TESTIMONIALS.TEXT_MAX_LENGTH}
                      className="bg-surface-raised text-body-md text-foreground min-h-36 rounded-2xl px-4 py-3 shadow-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-right">
                    {format(t.testimonials.form.counter, {
                      count: typed.length,
                      max: TESTIMONIALS.TEXT_MAX_LENGTH,
                    })}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error ? (
              <p role="alert" className="text-body-sm text-destructive">
                {copy.error}
              </p>
            ) : null}

            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={onClose}>
                {copy.cancel}
              </Button>
              <Button type="submit" variant="secondary" disabled={update.isPending}>
                {update.isPending ? copy.saving : copy.save}
              </Button>
              {testimonial.status !== 'approved' ? (
                <Button type="button" disabled={update.isPending} onClick={() => save(true)}>
                  {copy.saveAndPublish}
                </Button>
              ) : null}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
