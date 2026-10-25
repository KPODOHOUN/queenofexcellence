import { NextRequest, NextResponse } from "next/server";
import { findVotesAdminList } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { getPagination, paginatedResponse } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const eventId = request.nextUrl.searchParams.get("eventId") ?? undefined;
  const candidateId = request.nextUrl.searchParams.get("candidateId") ?? undefined;

  const { page, pageSize, skip, take } = getPagination(request);
  const { items: votes, total } = await findVotesAdminList(skip, take, {
    eventId,
    candidateId,
  });
  return NextResponse.json(paginatedResponse(votes, total, page, pageSize));
}
