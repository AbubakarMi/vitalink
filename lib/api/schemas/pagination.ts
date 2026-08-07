import { z } from "zod";

/**
 * Matches Application.Abstractions.Pagination.PagedListResult<T> exactly
 * (confirmed against vitalink-backend source): currentPage/pageSize/totalCount/
 * totalPages/data. Every admin list endpoint returns this shape.
 */
export function pagedResult<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    currentPage: z.number(),
    pageSize: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
    data: z.array(item),
  });
}
