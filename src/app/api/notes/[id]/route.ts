import { NextResponse } from 'next/server';
import { ApiError, parseBody, withUser } from '@/lib/api';
import { db } from '@/lib/db';
import { NOTE_SELECT } from '@/lib/notes';
import { CreateNoteBody } from '@/lib/validation/notes';

type Ctx = RouteContext<'/api/notes/[id]'>;

async function findNoteOr404(id: string, userId: string) {
  const note = await db().note.findUnique({
    where: { id },
    select: NOTE_SELECT,
  });
  if (!note || note.userId !== userId) {
    throw new ApiError(404, 'Note not found');
  }
  return note;
}

/** Retrieve a specific note by ID including its tags and reminders. */
export const GET = withUser<Ctx>(async (_req, { params, user }) => {
  const { id } = await params;
  return NextResponse.json({ note: await findNoteOr404(id, user.id) });
});

/** Update an existing note's content, formatting, position, color, or archive state. */
export const PUT = withUser<Ctx>(async (req, { params, user }) => {
  const { id } = await params;
  const { tags, reminders, ...data } = await parseBody(req, CreateNoteBody);
  await findNoteOr404(id, user.id);

  const note = await db().note.update({
    where: { id },
    data: {
      ...data,
      tags:
        tags !== undefined
          ? {
              deleteMany: {},
              create: tags.map((name) => ({ name: name.trim().toLowerCase() })),
            }
          : undefined,
      reminders:
        reminders !== undefined
          ? {
              deleteMany: {},
              create: reminders.map((reminderTime) => ({
                reminderTime: new Date(reminderTime),
              })),
            }
          : undefined,
    },
    select: NOTE_SELECT,
  });

  return NextResponse.json({ note });
});

/** Delete a note permanently from the board. */
export const DELETE = withUser<Ctx>(async (_req, { params, user }) => {
  const { id } = await params;
  await findNoteOr404(id, user.id);
  await db().note.delete({ where: { id } });
  return new Response(null, { status: 204 });
});
