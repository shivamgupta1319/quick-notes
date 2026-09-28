import { execFileSync } from 'node:child_process';
import { testDatabaseUrl } from './db-url';

const PRISMA = 'node_modules/.bin/prisma';

/**
 * Regenerate the client and apply pending migrations to the test database, once per run. Tests
 * empty the tables themselves (`resetDb`), so nothing here drops data.
 */
export default function setup(): void {
  testDatabaseUrl();
  execFileSync(PRISMA, ['generate'], { stdio: 'inherit' });
  execFileSync(PRISMA, ['migrate', 'deploy'], { stdio: 'inherit' });
}
