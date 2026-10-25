import { NextRequest, NextResponse } from "next/server";
import { findPaymentsAdminList } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { getPagination, paginatedResponse } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const eventId = request.nextUrl.searchParams.get("eventId") ?? undefined;
  const status = request.nextUrl.searchParams.get("status") ?? undefined;

  const { page, pageSize, skip, take } = getPagination(request);
  const { items: payments, total } = await findPaymentsAdminList(skip, take, {
    eventId,
    status,
  });
  return NextResponse.json(paginatedResponse(payments, total, page, pageSize));
}
