import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/app-shell/page-header';
import { NoteCard } from '@/components/notes/note-card';
import { NoteForm } from '@/components/notes/note-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NOTE_SELECT, type NoteDto } from '@/lib/notes';

export const metadata: Metadata = { title: 'Notes Corkboard' };

export default async function NotesCorkboardPage({ searchParams }: PageProps<'/notes'>) {
  const user = await requireUser();
  const sp = await searchParams;
  const search = typeof sp.search === 'string' ? sp.search : undefined;
  const tag = typeof sp.tag === 'string' ? sp.tag : undefined;

  const notes = await db().note.findMany({
    where: {
      userId: user.id,
      isArchived: false,
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { body: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(tag
        ? {
            tags: {
              some: {
                name: { equals: tag, mode: 'insensitive' },
              },
            },
          }
        : {}),
    },
    select: NOTE_SELECT,
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-4rem)]">
      <PageHeader
        title="Corkboard"
        description="Organize your sticky notes visually."
        actions={
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="h-11 bg-amber-600 hover:bg-amber-700 text-white font-medium">
                  + New Note
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Sticky Note</DialogTitle>
                </DialogHeader>
                <NoteForm />
              </DialogContent>
            </Dialog>
            <Button asChild variant="outline" className="h-11">
              <Link href="/notes/archive">Archived Notes</Link>
            </Button>
          </div>
        }
      />

      <div className="relative flex-1 min-h-[600px] rounded-xl border-2 border-dashed border-amber-900/20 bg-amber-50/50 p-6 overflow-hidden">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="text-5xl">📌</div>
            <h3 className="text-lg font-semibold text-amber-900">Your corkboard is empty</h3>
            <p className="text-sm text-amber-800/70 max-w-sm">
              Pin your very first sticky note to the board to capture and organize your thoughts.
            </p>
          </div>
        ) : (
          notes.map((note) => <NoteCard key={note.id} note={note as NoteDto} />)
        )}
      </div>
    </div>
  );
}
