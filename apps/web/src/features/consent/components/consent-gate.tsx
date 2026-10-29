'use client';

import type { ReactNode } from 'react';

import type { OptionalCategory } from '../constants';
import { useConsent } from '../hooks/use-consent';

interface ConsentGateProps {
  category: OptionalCategory;
  children: ReactNode;
  /** Shown while the visitor has not agreed (for example a "show the map" button). */
  fallback?: ReactNode;
}

/**
 * Renders its children only after the visitor agreed to the category. Wrap every analytics
 * script, ad pixel or third-party embed in it; nothing inside runs, loads or sets a cookie before
 * the "yes", and it unmounts when the choice is withdrawn.
 *
 *   <ConsentGate category="analytics"><AnalyticsScript /></ConsentGate>
 */
export function ConsentGate({ category, children, fallback = null }: ConsentGateProps) {
  const { hasConsent } = useConsent();
  return <>{hasConsent(category) ? children : fallback}</>;
}
