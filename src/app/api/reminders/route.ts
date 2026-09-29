import { NextResponse } from 'next/server';
import { parseBody, withUser } from '@/lib/api';
import { db } from '@/lib/db';
import { CreateReminderBody } from '@/lib/validation/notes';

/** List all scheduled reminders for the user's notes. */
export const GET = withUser(async (_req, { user }) => {
  const notes = await db().note.findMany({
    where: { userId: user.id },
    select: {
      reminders: {
        select: { id: true, reminderTime: true, isNotified: true, noteId: true, createdAt: true },
      },
    },
  });
  const reminders = notes.flatMap((n) => n.reminders);
  return NextResponse.json({ items: reminders });
});

/** Create a new reminder for a note. */
export const POST = withUser(async (req, { user }) => {
  const url = new URL(req.url);
  const noteId = url.searchParams.get('noteId');
  if (!noteId) {
    return NextResponse.json({ error: 'noteId query parameter is required' }, { status: 400 });
  }
  const note = await db().note.findUnique({ where: { id: noteId } });
  if (!note || note.userId !== user.id) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }
  const { reminderTime } = await parseBody(req, CreateReminderBody);
  const reminder = await db().reminder.create({
    data: {
      reminderTime: new Date(reminderTime),
      noteId,
    },
  });
  return NextResponse.json({ reminder }, { status: 201 });
});
