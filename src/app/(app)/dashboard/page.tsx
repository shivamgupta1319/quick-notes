import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/app-shell/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NOTE_SELECT } from '@/lib/notes';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const user = await requireUser();

  const [activeCount, archivedCount, recentNotes, reminders] = await Promise.all([
    db().note.count({ where: { userId: user.id, isArchived: false } }),
    db().note.count({ where: { userId: user.id, isArchived: true } }),
    db().note.findMany({
      where: { userId: user.id, isArchived: false },
      select: NOTE_SELECT,
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    db().reminder.findMany({
      where: {
        note: { userId: user.id, isArchived: false },
        isNotified: false,
      },
      include: { note: { select: { title: true, id: true } } },
      orderBy: { reminderTime: 'asc' },
      take: 5,
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Welcome, ${user.name}`}
        description="Manage your notes, corkboard, and reminders from your dashboard."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild className="h-11 bg-amber-600 hover:bg-amber-700 text-white font-medium">
              <Link href="/notes">Open Corkboard</Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Sticky Notes</CardTitle>
            <span className="text-2xl">📌</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Pinned on your corkboard</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Archived Notes</CardTitle>
            <span className="text-2xl">📥</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{archivedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Saved in archive</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Reminders</CardTitle>
            <span className="text-2xl">⏰</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reminders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active reminders</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-900">Quick Action</CardTitle>
            <span className="text-2xl">✨</span>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-amber-600 hover:bg-amber-700 text-white mt-1">
              <Link href="/notes">Go to Corkboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No notes created yet. Go to the corkboard to create one!
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {recentNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    style={{ borderLeftColor: note.color, borderLeftWidth: '6px' }}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span
                        className={`text-sm truncate ${note.isTitleBold ? 'font-bold' : 'font-medium'}`}
                      >
                        {note.title}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {note.body || 'No additional text'}
                      </span>
                    </div>
                    <Button asChild variant="ghost" size="sm" className="shrink-0">
                      <Link href="/notes">View</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            {reminders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No active reminders scheduled.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {reminders.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-sm font-medium truncate">{r.note.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.reminderTime).toLocaleString()}
                      </span>
                    </div>
                    <Button asChild variant="outline" size="sm" className="shrink-0">
                      <Link href="/notes">Open</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
