import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/app-shell/page-header';
import { ListPagination } from '@/components/list-pagination';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NOTE_SELECT } from '@/lib/notes';
import { pageArgs, parsePage } from '@/lib/pagination';

export const metadata: Metadata = { title: 'Archived Notes' };

const date = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

export default async function ArchivedNotesPage({ searchParams }: PageProps<'/notes/archive'>) {
  const user = await requireUser();
  const sp = await searchParams;
  const page = parsePage(sp.page);

  const [notes, total] = await Promise.all([
    db().note.findMany({
      where: { userId: user.id, isArchived: true },
      select: NOTE_SELECT,
      orderBy: { updatedAt: 'desc' },
      ...pageArgs(page),
    }),
    db().note.count({ where: { userId: user.id, isArchived: true } }),
  ]);

  return (
    <>
      <PageHeader
        title="Archived Notes"
        description="Review and restore previously archived sticky notes."
        actions={
          <Button asChild className="h-11">
            <Link href="/notes">Back to Corkboard</Link>
          </Button>
        }
      />
      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <p className="text-muted-foreground">No notes have been archived yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Archived At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notes.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="font-medium">
                    <span style={{ color: n.bodyTextColor ?? undefined }}>{n.title}</span>
                  </TableCell>
                  <TableCell>
                    <div
                      className="h-6 w-6 rounded-full border"
                      style={{ backgroundColor: n.color }}
                    />
                  </TableCell>
                  <TableCell>{date.format(n.updatedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <ListPagination path="/notes/archive" page={page} total={total} />
    </>
  );
}
