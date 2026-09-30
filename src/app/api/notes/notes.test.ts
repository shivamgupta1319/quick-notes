import { createUser, params, request, resetDb } from '@test/helpers';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { DELETE, GET as getOne, PUT } from './[id]/route';
import { POST as create, GET as list } from './route';

beforeEach(resetDb);

const newNote = {
  title: 'My First Note',
  body: 'Body text here',
  color: '#ffeb3b',
  tags: ['work', 'urgent'],
  reminders: ['2026-10-01T12:00:00.000Z'],
};

describe('Notes API', () => {
  it('requires authentication', async () => {
    const res = await list(await request('/api/notes'), params({}));
    expect(res.status).toBe(401);
  });

  it('creates and lists notes with tags and reminders', async () => {
    const user = await createUser();
    const createRes = await create(
      await request('/api/notes', { method: 'POST', body: newNote, user }),
      params({}),
    );
    expect(createRes.status).toBe(201);
    const { note } = await createRes.json();
    expect(note).toMatchObject({
      title: 'My First Note',
      body: 'Body text here',
      color: '#ffeb3b',
      tags: expect.any(Array),
      reminders: expect.any(Array),
    });
    expect(note.tags).toHaveLength(2);
    expect(note.reminders).toHaveLength(1);

    const listRes = await list(await request('/api/notes', { user }), params({}));
    expect(listRes.status).toBe(200);
    const pageData = await listRes.json();
    expect(pageData.total).toBe(1);
    expect(pageData.items[0].id).toBe(note.id);
  });

  it('retrieves, updates, and deletes a note', async () => {
    const user = await createUser();
    const createRes = await create(
      await request('/api/notes', { method: 'POST', body: newNote, user }),
      params({}),
    );
    const { note } = await createRes.json();
    const ctx = params({ id: note.id });

    const getRes = await getOne(await request(`/api/notes/${note.id}`, { user }), ctx);
    expect(getRes.status).toBe(200);

    const updateRes = await PUT(
      await request(`/api/notes/${note.id}`, {
        method: 'PUT',
        body: { ...newNote, title: 'Updated Title', isArchived: true },
        user,
      }),
      ctx,
    );
    expect(updateRes.status).toBe(200);
    const updated = await updateRes.json();
    expect(updated.note.title).toBe('Updated Title');
    expect(updated.note.isArchived).toBe(true);

    const deleteRes = await DELETE(
      await request(`/api/notes/${note.id}`, { method: 'DELETE', user }),
      ctx,
    );
    expect(deleteRes.status).toBe(204);
    expect(await db().note.findUnique({ where: { id: note.id } })).toBeNull();
  });

  it('fails to update non-existent note with 404', async () => {
    const user = await createUser();
    const updateRes = await PUT(
      await request('/api/notes/99999', {
        method: 'PUT',
        body: { ...newNote, title: 'Updated Title' },
        user,
      }),
      params({ id: '99999' }),
    );
    expect(updateRes.status).toBe(404);
  });
});
