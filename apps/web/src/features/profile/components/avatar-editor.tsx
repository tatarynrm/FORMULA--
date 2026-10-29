'use client';

import { Trash2, Upload } from 'lucide-react';

import { UserAvatar } from '@/components/common/user-avatar';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { FileUploadButton } from '@/features/files/components/file-upload-button';
import { t } from '@/locales';

import { useUpdateProfile } from '../hooks/use-profile';

/** Picture of the person: upload, replace or remove. Works for students and admins. */
export function AvatarEditor() {
  const copy = t.profile.avatar;
  const { data: user } = useCurrentUser();
  const update = useUpdateProfile();

  if (!user) return null;

  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
      <UserAvatar name={user.name} fileId={user.avatarFileId} size="xl" />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <FileUploadButton
            purpose="avatar"
            size="sm"
            disabled={update.isPending}
            onUploaded={(file) => update.mutate({ avatarFileId: file.id })}
          >
            <Upload />
            {user.avatarFileId ? copy.replace : copy.upload}
          </FileUploadButton>

          {user.avatarFileId ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={update.isPending}
              onClick={() => update.mutate({ avatarFileId: null })}
            >
              <Trash2 />
              {copy.remove}
            </Button>
          ) : null}
        </div>

        <p className="text-body-xs text-muted-foreground">{copy.hint}</p>
        {update.isError ? (
          <p role="alert" className="text-body-sm text-input-error-text">
            {t.profile.saveError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
