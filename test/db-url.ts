/**
 * The database tests may use. Refuses anything whose name does not end in `_test`, because the
 * tests wipe it.
 */
export function testDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Tests need DATABASE_URL pointing at a *_test database');
  const name = new URL(url).pathname.replace(/^\//, '');
  if (!name.endsWith('_test')) {
    throw new Error(`Tests only run against a database named *_test, got "${name}"`);
  }
  return url;
}
