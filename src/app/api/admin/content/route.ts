import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { setSiteContent } from "@/lib/data";

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const key = request.nextUrl.searchParams.get("key");
  if (key) {
    const content = await prisma.siteContent.findUnique({ where: { key } });
    return NextResponse.json(content);
  }

  const all = await prisma.siteContent.findMany();
  return NextResponse.json(all);
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { key, value } = await request.json();
  const content = await setSiteContent(key, value);
  return NextResponse.json(content);
}
