import { createUser, params, request, resetDb } from '@test/helpers';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { PAGE_SIZE } from '@/lib/pagination';
import { verifyPassword } from '@/lib/password';
import { DELETE, GET as getOne, PATCH } from './[id]/route';
import { POST as create, GET as list } from './route';

beforeEach(resetDb);

const newUser = {
  email: 'New@Example.com',
  name: 'New Person',
  role: 'MEMBER',
  password: 'long-enough',
};

describe('who may use /api/users', () => {
  it('answers 401 when signed out and 403 for members', async () => {
    const member = await createUser();
    expect((await list(await request('/api/users'), params({}))).status).toBe(401);
    expect((await list(await request('/api/users', { user: member }), params({}))).status).toBe(
      403,
    );
    const res = await create(
      await request('/api/users', { method: 'POST', body: newUser, user: member }),
      params({}),
    );
    expect(res.status).toBe(403);
  });
});

describe('POST /api/users', () => {
  it('creates a user with a hashed password and never returns the hash', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const res = await create(
      await request('/api/users', { method: 'POST', body: newUser, user: admin }),
      params({}),
    );
    expect(res.status).toBe(201);
    const { user } = await res.json();
    expect(user).toMatchObject({ email: 'new@example.com', name: 'New Person', role: 'MEMBER' });
    expect(user.passwordHash).toBeUndefined();
    const stored = await db().user.findUniqueOrThrow({ where: { id: user.id } });
    expect(await verifyPassword('long-enough', stored.passwordHash)).toBe(true);
  });

  it('answers 400 for invalid input and 409 for a taken email', async () => {
    const admin = await createUser({ role: 'ADMIN', email: 'taken@example.com' });
    const bad = await create(
      await request('/api/users', {
        method: 'POST',
        body: { ...newUser, password: 'short' },
        user: admin,
      }),
      params({}),
    );
    expect(bad.status).toBe(400);
    const dup = await create(
      await request('/api/users', {
        method: 'POST',
        body: { ...newUser, email: 'TAKEN@example.com' },
        user: admin,
      }),
      params({}),
    );
    expect(dup.status).toBe(409);
  });
});

describe('GET /api/users', () => {
  it('pages the list, newest first', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    for (let i = 0; i < PAGE_SIZE; i++) await createUser();
    const first = await (
      await list(await request('/api/users', { user: admin }), params({}))
    ).json();
    expect(first).toMatchObject({ page: 1, pageSize: PAGE_SIZE, total: PAGE_SIZE + 1 });
    expect(first.items).toHaveLength(PAGE_SIZE);
    const second = await (
      await list(await request('/api/users?page=2', { user: admin }), params({}))
    ).json();
    expect(second.items.map((u: { id: string }) => u.id)).toEqual([admin.id]);
  });
});

describe('/api/users/[id]', () => {
  it('reads, updates and deletes a user', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const other = await createUser();
    const ctx = params({ id: other.id });

    const read = await getOne(await request(`/api/users/${other.id}`, { user: admin }), ctx);
    expect((await read.json()).user.id).toBe(other.id);

    const patch = await PATCH(
      await request(`/api/users/${other.id}`, {
        method: 'PATCH',
        body: { name: 'Renamed', role: 'ADMIN' },
        user: admin,
      }),
      ctx,
    );
    expect((await patch.json()).user).toMatchObject({ name: 'Renamed', role: 'ADMIN' });

    const del = await DELETE(
      await request(`/api/users/${other.id}`, { method: 'DELETE', user: admin }),
      ctx,
    );
    expect(del.status).toBe(204);
    expect(await db().user.findUnique({ where: { id: other.id } })).toBeNull();
  });

  it('answers 404 for an unknown id', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const res = await getOne(
      await request('/api/users/nope', { user: admin }),
      params({ id: 'nope' }),
    );
    expect(res.status).toBe(404);
  });

  it('keeps an admin: no changing your own role, no deleting yourself', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const ctx = params({ id: admin.id });
    const demote = await PATCH(
      await request(`/api/users/${admin.id}`, {
        method: 'PATCH',
        body: { role: 'MEMBER' },
        user: admin,
      }),
      ctx,
    );
    expect(demote.status).toBe(400);
    const del = await DELETE(
      await request(`/api/users/${admin.id}`, { method: 'DELETE', user: admin }),
      ctx,
    );
    expect(del.status).toBe(400);
    expect((await db().user.findUniqueOrThrow({ where: { id: admin.id } })).role).toBe('ADMIN');
  });

  it('changes the password only when one is sent', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const other = await createUser({ password: 'first-password' });
    const ctx = params({ id: other.id });
    await PATCH(
      await request(`/api/users/${other.id}`, {
        method: 'PATCH',
        body: { name: 'X' },
        user: admin,
      }),
      ctx,
    );
    let stored = await db().user.findUniqueOrThrow({ where: { id: other.id } });
    expect(await verifyPassword('first-password', stored.passwordHash)).toBe(true);
    await PATCH(
      await request(`/api/users/${other.id}`, {
        method: 'PATCH',
        body: { password: 'second-password' },
        user: admin,
      }),
      ctx,
    );
    stored = await db().user.findUniqueOrThrow({ where: { id: other.id } });
    expect(await verifyPassword('second-password', stored.passwordHash)).toBe(true);
  });
});
