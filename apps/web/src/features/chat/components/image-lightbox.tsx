'use client';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { t } from '@/locales';

import { ChatImage } from './chat-image';

interface ImageLightboxProps {
  /** The picture to show; `null` keeps the dialog closed. */
  fileId: string | null;
  onClose: () => void;
}

/** Full-size view of a picture from the thread. */
export function ImageLightbox({ fileId, onClose }: ImageLightboxProps) {
  return (
    <Dialog
      open={fileId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="w-auto max-w-[calc(100%-2rem)] items-center p-3 pt-12 sm:max-w-5xl">
        <DialogTitle className="sr-only">{t.chat.thread.imageTitle}</DialogTitle>
        <DialogDescription className="sr-only">{t.chat.thread.imageAlt}</DialogDescription>
        {fileId ? (
          <ChatImage
            fileId={fileId}
            alt={t.chat.thread.imageAlt}
            className="max-h-[80dvh] rounded-xl"
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
