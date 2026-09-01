import { NextRequest } from "next/server";

export const DEFAULT_PAGE_SIZE = 20;

const MAX_PAGE_SIZE = 200;

export function getPagination(request: NextRequest, defaultPageSize: number = DEFAULT_PAGE_SIZE) {
  const pageParam = parseInt(request.nextUrl.searchParams.get("page") || "1", 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const sizeParam = parseInt(request.nextUrl.searchParams.get("pageSize") || "", 10);
  const pageSize =
    Number.isFinite(sizeParam) && sizeParam > 0
      ? Math.min(sizeParam, MAX_PAGE_SIZE)
      : defaultPageSize;

  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function paginatedResponse<T>(items: T[], total: number, page: number, pageSize: number) {
  return { items, total, page, pageSize };
}
