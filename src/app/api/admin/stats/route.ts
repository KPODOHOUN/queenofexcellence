import { NextResponse } from "next/server";
import { getAdminStats } from "@/lib/data";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const stats = await getAdminStats();
  return NextResponse.json(stats);
}
