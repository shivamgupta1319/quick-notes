import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

/**
 * The test database has every migration applied (global setup). If it still differs from
 * schema.prisma, a schema change is missing its migration.
 */
describe('migrations', () => {
  it('match prisma/schema.prisma', () => {
    const run = spawnSync(
      'node_modules/.bin/prisma',
      [
        'migrate',
        'diff',
        '--from-config-datasource',
        '--to-schema',
        'prisma/schema.prisma',
        '--script',
        '--exit-code',
      ],
      { encoding: 'utf8' },
    );
    const missing = run.status === 2 ? run.stdout : '';
    expect(missing, 'schema.prisma changed without a migration; add this SQL as a migration').toBe(
      '',
    );
    expect(run.status).toBe(0);
  });
});
