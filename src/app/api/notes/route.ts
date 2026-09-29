import type { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { parseBody, withUser } from '@/lib/api';
import { db } from '@/lib/db';
import { NOTE_SELECT, type NoteDto } from '@/lib/notes';
import { PAGE_SIZE, type Page, pageArgs, parsePage } from '@/lib/pagination';
import { CreateNoteBody } from '@/lib/validation/notes';

/** List notes with optional search, tag filtering, and archive status. */
export const GET = withUser(async (req, { user }) => {
  const url = new URL(req.url);
  const page = parsePage(url.searchParams.get('page'));
  const search = url.searchParams.get('search');
  const tag = url.searchParams.get('tag');
  const isArchivedParam = url.searchParams.get('isArchived');

  const where: Prisma.NoteWhereInput = {
    userId: user.id,
    ...(isArchivedParam !== null
      ? { isArchived: isArchivedParam === 'true' || isArchivedParam === '1' }
      : {}),
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
  };

  const [items, total] = await Promise.all([
    db().note.findMany({
      where,
      select: NOTE_SELECT,
      orderBy: { updatedAt: 'desc' },
      ...pageArgs(page),
    }),
    db().note.count({ where }),
  ]);

  return NextResponse.json({ items, page, pageSize: PAGE_SIZE, total } satisfies Page<NoteDto>);
});

/** Create a new note with formatting, position, tags, and reminders. */
export const POST = withUser(async (req, { user }) => {
  const { tags, reminders, ...data } = await parseBody(req, CreateNoteBody);

  const note = await db().note.create({
    data: {
      ...data,
      userId: user.id,
      tags:
        tags && tags.length > 0
          ? { create: tags.map((name) => ({ name: name.trim().toLowerCase() })) }
          : undefined,
      reminders:
        reminders && reminders.length > 0
          ? { create: reminders.map((reminderTime) => ({ reminderTime: new Date(reminderTime) })) }
          : undefined,
    },
    select: NOTE_SELECT,
  });

  return NextResponse.json({ note }, { status: 201 });
});
