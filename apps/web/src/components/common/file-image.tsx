import { fileUrl } from '@/lib/files';
import { cn } from '@/lib/utils';

interface FileImageProps {
  /** Id of an uploaded image (purpose `image` or `avatar`). */
  fileId: string;
  alt: string;
  className?: string;
}

/**
 * Picture stored in our own file storage (question images, option images, avatars). A plain `<img>`
 * is used on purpose: the file needs the session cookie, and the Next.js image optimizer fetches
 * remote images without cookies. Always give a meaningful `alt` (or `""` for pure decoration).
 */
export function FileImage({ fileId, alt, className }: FileImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- see the comment above
    <img
      src={fileUrl(fileId)}
      alt={alt}
      loading="lazy"
      decoding="async"
      // `self-start`: inside a flex column the picture must keep its own width, not stretch to the card.
      className={cn('h-auto w-auto max-w-full self-start object-contain', className)}
    />
  );
}
