'use client';

import type { AuthUser } from '@formula/shared';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from '@/lib/format';
import { t } from '@/locales';

import { SubjectGrantsSection } from './student-access/subject-grants-section';
import { SubtopicGrantsSection } from './student-access/subtopic-grants-section';

interface StudentAccessDialogProps {
  student: AuthUser;
  onClose: () => void;
}

/**
 * What one student may open: a whole subject (every subtopic, also the ones added later) or single
 * subtopics. Free subtopics need no grant. Mount it only while it is open.
 */
export function StudentAccessDialog({ student, onClose }: StudentAccessDialogProps) {
  const copy = t.adminContent.access;
  const fullName = `${student.name} ${student.surname}`.trim();

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{format(copy.title, { name: fullName })}</DialogTitle>
          <DialogDescription>{copy.intro}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <SubjectGrantsSection userId={student.id} studentName={fullName} />
          <SubtopicGrantsSection userId={student.id} />
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            {copy.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
