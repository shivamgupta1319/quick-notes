import { createUser, params, request, resetDb } from '@test/helpers';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { POST as createNote } from '../notes/route';
import { DELETE as deleteTag } from './[id]/route';
import { POST as createTag, GET as listTags } from './route';

beforeEach(resetDb);

describe('Tags API', () => {
  it('requires authentication', async () => {
    const res = await listTags(await request('/api/tags'), params({}));
    expect(res.status).toBe(401);
  });

  it('creates and lists tags for a note', async () => {
    const user = await createUser();
    const noteRes = await createNote(
      await request('/api/notes', {
        method: 'POST',
        body: { title: 'Test Note', color: '#ffeb3b' },
        user,
      }),
      params({}),
    );
    const { note } = await noteRes.json();

    const tagRes = await createTag(
      await request(`/api/tags?noteId=${note.id}`, {
        method: 'POST',
        body: { name: 'important' },
        user,
      }),
      params({}),
    );
    expect(tagRes.status).toBe(201);
    const { tag } = await tagRes.json();
    expect(tag.name).toBe('important');
    expect(tag.noteId).toBe(note.id);

    const listRes = await listTags(await request('/api/tags', { user }), params({}));
    expect(listRes.status).toBe(200);
    const listData = await listRes.json();
    expect(listData.items).toHaveLength(1);
    expect(listData.items[0].name).toBe('important');

    const deleteRes = await deleteTag(
      await request(`/api/tags/${tag.id}`, { method: 'DELETE', user }),
      params({ id: tag.id }),
    );
    expect(deleteRes.status).toBe(204);
    expect(await db().tag.findUnique({ where: { id: tag.id } })).toBeNull();
  });

  it('returns 404 when adding tag to non-existent note', async () => {
    const user = await createUser();
    const tagRes = await createTag(
      await request('/api/tags?noteId=99999', {
        method: 'POST',
        body: { name: 'urgent' },
        user,
      }),
      params({}),
    );
    expect(tagRes.status).toBe(404);
  });
});
