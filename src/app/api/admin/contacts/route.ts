import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { getPagination, paginatedResponse } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { page, pageSize, skip, take } = getPagination(request);
  const [messages, total] = await prisma.$transaction([
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, skip, take }),
    prisma.contactMessage.count(),
  ]);
  return NextResponse.json(paginatedResponse(messages, total, page, pageSize));
}

export async function PATCH(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id, read } = await request.json();
  const message = await prisma.contactMessage.update({
    where: { id },
    data: { read },
  });
  return NextResponse.json(message);
}
