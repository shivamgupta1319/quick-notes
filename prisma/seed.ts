import { db } from '../src/lib/db';
import { hashPassword } from '../src/lib/password';

/**
 * Creates the demo admin, or leaves it alone when it exists. Production requires
 * SEED_ADMIN_PASSWORD; development falls back to a well-known password.
 */
async function main(): Promise<void> {
  const email = (process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com').toLowerCase();
  let password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) {
    if (process.env.NODE_ENV === 'production') throw new Error('Set SEED_ADMIN_PASSWORD');
    password = 'demo-password';
  }
  await db().user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Demo Admin',
      role: 'ADMIN',
      passwordHash: await hashPassword(password),
    },
  });
  console.log(`Seeded admin ${email}`);
}

main()
  .then(() => db().$disconnect())
  .catch(async (err: unknown) => {
    console.error(err);
    await db().$disconnect();
    process.exit(1);
  });
