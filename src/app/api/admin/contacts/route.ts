import { NextRequest, NextResponse } from "next/server";
import { listPaged, updateRow } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { getPagination, paginatedResponse } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { page, pageSize, skip, take } = getPagination(request);
  const { items: messages, total } = await listPaged(
    "contact_message",
    "created_at DESC",
    skip,
    take
  );
  return NextResponse.json(paginatedResponse(messages, total, page, pageSize));
}

export async function PATCH(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id, read } = await request.json();
  const message = await updateRow("contact_message", id, { read });
  return NextResponse.json(message);
}
