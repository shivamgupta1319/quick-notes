import { describe, expect, it } from 'vitest';
import { PAGE_SIZE, pageArgs, parsePage } from './pagination';

describe('pagination', () => {
  it('reads a page number and falls back to 1', () => {
    expect(parsePage('3')).toBe(3);
    expect(parsePage(['2', '5'])).toBe(2);
    for (const bad of [undefined, null, '', '0', '-1', '1.5', 'abc'])
      expect(parsePage(bad)).toBe(1);
  });

  it('turns a page into skip/take', () => {
    expect(pageArgs(1)).toEqual({ skip: 0, take: PAGE_SIZE });
    expect(pageArgs(3)).toEqual({ skip: 2 * PAGE_SIZE, take: PAGE_SIZE });
  });
});
