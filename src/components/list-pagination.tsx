import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { PAGE_SIZE } from '@/lib/pagination';

/** Previous / "Page x of y" / Next under a list. Renders nothing when everything fits one page. */
export function ListPagination({
  path,
  page,
  total,
}: {
  path: string;
  page: number;
  total: number;
}) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages === 1) return null;
  return (
    <Pagination className="mt-4">
      <PaginationContent>
        {page > 1 && (
          <PaginationItem>
            <PaginationPrevious href={`${path}?page=${page - 1}`} />
          </PaginationItem>
        )}
        <PaginationItem className="px-3 text-sm text-muted-foreground">
          Page {page} of {pages}
        </PaginationItem>
        {page < pages && (
          <PaginationItem>
            <PaginationNext href={`${path}?page=${page + 1}`} />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
