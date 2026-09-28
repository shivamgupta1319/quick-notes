export const PAGE_SIZE = 20;

/** Page number from `?page=`, starting at 1. Anything invalid means page 1. */
export function parsePage(value: string | string[] | null | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export function pageArgs(page: number): { skip: number; take: number } {
  return { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE };
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
