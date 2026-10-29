import { t } from '@/locales';

/** Visible "there are unsaved changes" indicator that sits next to a save button. */
export function UnsavedBadge() {
  return (
    <span className="text-body-sm text-text-secondary flex items-center gap-2" role="status">
      <span className="bg-primary size-2.5 rounded-full" aria-hidden />
      {t.adminContent.unsaved.badge}
    </span>
  );
}
