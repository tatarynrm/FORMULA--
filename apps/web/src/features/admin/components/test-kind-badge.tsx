import type { TestKind } from '@formula/shared';

import { Badge } from '@/components/ui/badge';
import { t } from '@/locales';

/** "З варіантами" or "Ситуаційний" pill. */
export function TestKindBadge({ kind }: { kind: TestKind }) {
  return (
    <Badge variant={kind === 'choice' ? 'brand' : 'secondary'}>
      {t.adminContent.tests.kinds[kind]}
    </Badge>
  );
}
