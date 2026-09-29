import { NextResponse } from 'next/server';
import { ApiError, parseBody, withUser } from '@/lib/api';
import { db } from '@/lib/db';
import { UpdateReminderBody } from '@/lib/validation/notes';

type Ctx = RouteContext<'/api/reminders/[id]'>;

/** Update reminder status or time. */
export const PATCH = withUser<Ctx>(async (req, { params, user }) => {
  const { id } = await params;
  const reminder = await db().reminder.findUnique({
    where: { id },
    include: { note: true },
  });
  if (!reminder || reminder.note.userId !== user.id) {
    throw new ApiError(404, 'Reminder not found');
  }
  const data = await parseBody(req, UpdateReminderBody);
  const updated = await db().reminder.update({
    where: { id },
    data: {
      ...(data.reminderTime ? { reminderTime: new Date(data.reminderTime) } : {}),
      ...(data.isNotified !== undefined ? { isNotified: data.isNotified } : {}),
    },
  });
  return NextResponse.json({ reminder: updated });
});

/** Delete a reminder. */
export const DELETE = withUser<Ctx>(async (_req, { params, user }) => {
  const { id } = await params;
  const reminder = await db().reminder.findUnique({
    where: { id },
    include: { note: true },
  });
  if (!reminder || reminder.note.userId !== user.id) {
    throw new ApiError(404, 'Reminder not found');
  }
  await db().reminder.delete({ where: { id } });
  return new Response(null, { status: 204 });
});
