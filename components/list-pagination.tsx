"use client";

import { cn } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useListPaginationContext, Translate, useTranslate } from "ra-core";

/**
 * A pagination component with page numbers and rows per page selector.
 *
 * Displays pagination controls with previous/next buttons, page numbers with ellipsis for long lists,
 * and a dropdown to change items per page. Works with List context.
 *
 * @see {@link https://marmelab.com/shadcn-admin-kit/docs/listpagination/ ListPagination documentation}
 *
 * @example
 * import { List, ListPagination } from '@/components/admin';
 *
 * const PostListPagination = () => (
 *   <ListPagination rowsPerPageOptions={[5, 10, 25]} />
 * );
 *
 * export const PostList = () => (
 *   <List pagination={<PostListPagination />}>
 *     // ...
 *   </List>
 * );
 */
export const ListPagination = ({
  rowsPerPageOptions = [5, 10, 25, 50],
  className,
}: {
  rowsPerPageOptions?: number[];
  className?: string;
}) => {
  const translate = useTranslate();
  const {
    hasPreviousPage,
    hasNextPage,
    page,
    perPage,
    setPerPage,
    total,
    setPage,
  } = useListPaginationContext();

  const pageStart = (page - 1) * perPage + 1;
  const pageEnd = hasNextPage ? page * perPage : total;

  const boundaryCount = 1;
  const siblingCount = 1;
  const count = total ? Math.ceil(total / perPage) : 1;

  const range = (start: number, end: number) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, i) => start + i);
  };

  const startPages = range(1, Math.min(boundaryCount, count));
  const endPages = range(
    Math.max(count - boundaryCount + 1, boundaryCount + 1),
    count,
  );

  const siblingsStart = Math.max(
    Math.min(
      // Natural start
      page - siblingCount,
      // Lower boundary when page is high
      count - boundaryCount - siblingCount * 2 - 1,
    ),
    // Greater than startPages
    boundaryCount + 2,
  );

  const siblingsEnd = Math.min(
    Math.max(
      // Natural end
      page + siblingCount,
      // Upper boundary when page is low
      boundaryCount + siblingCount * 2 + 2,
    ),
    // Less than endPages
    count - boundaryCount - 1,
  );

  const siblingPages = range(siblingsStart, siblingsEnd);

  const pageChangeHandler = (newPage: number) => {
    return (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setPage(newPage);
    };
  };

  return (
    <div
      className={cn(
        "flex items-center justify-end space-x-2 gap-3 text-xs",
        className
      )}
    >
      <div className="hidden md:flex items-center space-x-1.5">
        <p className="text-xs text-muted-foreground font-normal whitespace-nowrap">
          <Translate i18nKey="ra.navigation.page_rows_per_page">
            Rows per page:
          </Translate>
        </p>
        <Select
          items={rowsPerPageOptions.map((pageSize) => ({
            label: `${pageSize}`,
            value: `${pageSize}`,
          }))}
          value={perPage.toString()}
          onValueChange={(value) => {
            if (value) {
              setPerPage(Number(value));
            }
          }}
        >
          <SelectTrigger size="sm" className="h-7 w-fit min-w-[3.5rem] gap-1 px-2 rounded-md text-xs border-border bg-background shadow-none">
            <SelectValue placeholder={perPage} />
          </SelectTrigger>
          <SelectContent side="top" className="min-w-[3.5rem] p-0.5">
            <SelectGroup>
              {rowsPerPageOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`} className="text-xs py-1 px-2">
                  {pageSize}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="text-xs text-muted-foreground font-normal whitespace-nowrap">
        <Translate
          i18nKey="ra.navigation.page_range_info"
          options={{
            offsetBegin: pageStart,
            offsetEnd: pageEnd,
            total: total === -1 ? pageEnd : total,
          }}
        >
          {total != null
            ? `${pageStart}–${pageEnd} of ${total === -1 ? pageEnd : total}`
            : null}
        </Translate>
      </div>
      <Pagination className="w-auto mx-0">
        <PaginationContent className="gap-0.5">
          <PaginationItem>
            {hasPreviousPage ? (
              <PaginationLink
                onClick={pageChangeHandler(page - 1)}
                className="h-7 w-7 p-0 flex items-center justify-center rounded-md"
                aria-label={translate("ra.navigation.previous", {
                  _: "Previous",
                })}
              >
                <ChevronLeftIcon className="w-3.5 h-3.5" />
              </PaginationLink>
            ) : (
              <span className="inline-flex items-center justify-center size-7 text-muted-foreground/40 select-none">
                <ChevronLeftIcon className="w-3.5 h-3.5" />
              </span>
            )}
          </PaginationItem>
          {startPages.map((pageNumber) => (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                onClick={pageChangeHandler(pageNumber)}
                isActive={pageNumber === page}
                className="h-7 min-w-7 px-1.5 text-xs rounded-md"
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          ))}
          {siblingsStart > boundaryCount + 2 ? (
            <PaginationItem>
              <PaginationEllipsis className="size-7 [&_svg]:size-3" />
            </PaginationItem>
          ) : boundaryCount + 1 < count - boundaryCount ? (
            <PaginationItem>
              <PaginationLink
                onClick={pageChangeHandler(boundaryCount + 1)}
                isActive={boundaryCount + 1 === page}
                className="h-7 min-w-7 px-1.5 text-xs rounded-md"
              >
                {boundaryCount + 1}
              </PaginationLink>
            </PaginationItem>
          ) : null}
          {siblingPages.map((pageNumber) => (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                onClick={pageChangeHandler(pageNumber)}
                isActive={pageNumber === page}
                className="h-7 min-w-7 px-1.5 text-xs rounded-md"
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          ))}
          {siblingsEnd < count - boundaryCount - 1 ? (
            <PaginationItem>
              <PaginationEllipsis className="size-7 [&_svg]:size-3" />
            </PaginationItem>
          ) : count - boundaryCount > boundaryCount ? (
            <PaginationItem>
              <PaginationLink
                onClick={pageChangeHandler(count - boundaryCount)}
                isActive={count - boundaryCount === page}
                className="h-7 min-w-7 px-1.5 text-xs rounded-md"
              >
                {count - boundaryCount}
              </PaginationLink>
            </PaginationItem>
          ) : null}
          {endPages.map((pageNumber) => (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                onClick={pageChangeHandler(pageNumber)}
                isActive={pageNumber === page}
                className="h-7 min-w-7 px-1.5 text-xs rounded-md"
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            {hasNextPage ? (
              <PaginationLink
                onClick={pageChangeHandler(page + 1)}
                className="h-7 w-7 p-0 flex items-center justify-center rounded-md"
                aria-label={translate("ra.navigation.next", { _: "Next" })}
              >
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </PaginationLink>
            ) : (
              <span className="inline-flex items-center justify-center size-7 text-muted-foreground/40 select-none">
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </span>
            )}
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};
