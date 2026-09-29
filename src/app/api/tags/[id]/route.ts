import { ApiError, withUser } from '@/lib/api';
import { db } from '@/lib/db';

type Ctx = RouteContext<'/api/tags/[id]'>;

/** Remove a tag from a note. */
export const DELETE = withUser<Ctx>(async (_req, { params, user }) => {
  const { id } = await params;
  const tag = await db().tag.findUnique({
    where: { id },
    include: { note: true },
  });
  if (!tag || tag.note.userId !== user.id) {
    throw new ApiError(404, 'Tag not found');
  }
  await db().tag.delete({ where: { id } });
  return new Response(null, { status: 204 });
});
