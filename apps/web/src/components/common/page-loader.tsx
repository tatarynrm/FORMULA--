import { LogoLoader } from './logo-loader';

/**
 * Full-screen loader with the pulsing logo exactly in the middle of the viewport.
 * Used for route transitions and `loading.tsx`; it fades in after 150ms (see `.page-loader`).
 */
export function PageLoader() {
  return (
    <div className="page-loader bg-background/70 fixed inset-0 z-100 flex items-center justify-center backdrop-blur-sm">
      <LogoLoader size="lg" />
    </div>
  );
}
