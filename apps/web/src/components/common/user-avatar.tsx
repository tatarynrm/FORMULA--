import { cn } from '@/lib/utils';

import { FileImage } from './file-image';

const SIZES = {
  sm: 'size-8 text-body-xs',
  md: 'size-10 text-body-md',
  lg: 'size-16 text-body-xl',
  xl: 'size-24 text-title',
} as const;

interface UserAvatarProps {
  /** Used for the letter shown when there is no picture. */
  name: string;
  /** Id of the uploaded avatar. */
  fileId?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}

/** Round avatar: the uploaded picture, or the first letter of the name on the brand color. */
export function UserAvatar({ name, fileId, size = 'md', className }: UserAvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'bg-avatar text-primary-foreground flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold',
        SIZES[size],
        className,
      )}
    >
      {fileId ? (
        <FileImage fileId={fileId} alt="" className="size-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  );
}
