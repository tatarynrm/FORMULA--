'use client';

import { EllipsisVertical } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { t } from '@/locales';

import { ConfirmDialog, type RequiredText } from './confirm-dialog';

export interface RowAction {
  key: string;
  label: string;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
  /**
   * Asks first, with the "Видалити?" modal from the design, and only then runs `onSelect`.
   * `requireText` also asks to type a name before the confirm button works.
   */
  confirm?: {
    title: string;
    description: string;
    confirmLabel: string;
    requireText?: RequiredText;
  };
}

interface RowActionsProps {
  actions: RowAction[];
  /** Accessible name of the menu button; defaults to "Дії". */
  label?: string;
}

/** Kebab menu of a content row. Actions with `confirm` open a confirmation modal before they run. */
export function RowActions({ actions, label = t.admin.row.actions }: RowActionsProps) {
  const [asking, setAsking] = useState<RowAction | null>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={label} className="text-text-secondary">
            <EllipsisVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map((action) => (
            <DropdownMenuItem
              key={action.key}
              variant={action.destructive ? 'destructive' : 'default'}
              disabled={action.disabled}
              onSelect={() => (action.confirm ? setAsking(action) : action.onSelect())}
            >
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {asking?.confirm ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setAsking(null);
          }}
          title={asking.confirm.title}
          description={asking.confirm.description}
          confirmLabel={asking.confirm.confirmLabel}
          requireText={asking.confirm.requireText}
          onConfirm={asking.onSelect}
        />
      ) : null}
    </>
  );
}
