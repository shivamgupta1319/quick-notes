import { createUser, params, request, resetDb } from '@test/helpers';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { POST as createNote } from '../notes/route';
import { DELETE as deleteReminder, PATCH as updateReminder } from './[id]/route';
import { POST as createReminder, GET as listReminders } from './route';

beforeEach(resetDb);

describe('Reminders API', () => {
  it('requires authentication', async () => {
    const res = await listReminders(await request('/api/reminders'), params({}));
    expect(res.status).toBe(401);
  });

  it('creates, lists, updates, and deletes reminders for a note', async () => {
    const user = await createUser();
    const noteRes = await createNote(
      await request('/api/notes', {
        method: 'POST',
        body: { title: 'Reminder Note', color: '#ffeb3b' },
        user,
      }),
      params({}),
    );
    const { note } = await noteRes.json();

    const reminderTime = '2026-12-01T10:00:00.000Z';
    const remRes = await createReminder(
      await request(`/api/reminders?noteId=${note.id}`, {
        method: 'POST',
        body: { reminderTime },
        user,
      }),
      params({}),
    );
    expect(remRes.status).toBe(201);
    const { reminder } = await remRes.json();
    expect(reminder.reminderTime).toBe(reminderTime);
    expect(reminder.noteId).toBe(note.id);

    const listRes = await listReminders(await request('/api/reminders', { user }), params({}));
    expect(listRes.status).toBe(200);
    const listData = await listRes.json();
    expect(listData.items).toHaveLength(1);

    const patchRes = await updateReminder(
      await request(`/api/reminders/${reminder.id}`, {
        method: 'PATCH',
        body: { isNotified: true },
        user,
      }),
      params({ id: reminder.id }),
    );
    expect(patchRes.status).toBe(200);
    const patched = await patchRes.json();
    expect(patched.reminder.isNotified).toBe(true);

    const deleteRes = await deleteReminder(
      await request(`/api/reminders/${reminder.id}`, { method: 'DELETE', user }),
      params({ id: reminder.id }),
    );
    expect(deleteRes.status).toBe(204);
    expect(await db().reminder.findUnique({ where: { id: reminder.id } })).toBeNull();
  });

  it('returns 404 when adding reminder to non-existent note', async () => {
    const user = await createUser();
    const remRes = await createReminder(
      await request('/api/reminders?noteId=99999', {
        method: 'POST',
        body: { reminderTime: '2026-12-01T10:00:00.000Z' },
        user,
      }),
      params({}),
    );
    expect(remRes.status).toBe(404);
  });
});
