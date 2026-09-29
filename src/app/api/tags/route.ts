import { NextResponse } from 'next/server';
import { parseBody, withUser } from '@/lib/api';
import { db } from '@/lib/db';
import { CreateTagBody } from '@/lib/validation/notes';

/** List all unique tags used across the user's notes. */
export const GET = withUser(async (_req, { user }) => {
  const notes = await db().note.findMany({
    where: { userId: user.id },
    select: { tags: { select: { id: true, name: true, noteId: true, createdAt: true } } },
  });
  const tagMap = new Map();
  for (const n of notes) {
    for (const t of n.tags) {
      if (!tagMap.has(t.name)) {
        tagMap.set(t.name, t);
      }
    }
  }
  return NextResponse.json({ items: Array.from(tagMap.values()) });
});

/** Add a new tag to a note. */
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
  const { name } = await parseBody(req, CreateTagBody);
  const tag = await db().tag.create({
    data: {
      name: name.trim().toLowerCase(),
      noteId,
    },
  });
  return NextResponse.json({ tag }, { status: 201 });
});
