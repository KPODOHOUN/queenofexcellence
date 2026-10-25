import { NextRequest, NextResponse } from "next/server";
import { findAllSiteContent, findSiteContentByKey } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { setSiteContent } from "@/lib/data";
import { normalizeSocialLinks } from "@/lib/social";
import type { SocialLinks } from "@/types/social";

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const key = request.nextUrl.searchParams.get("key");
  if (key) {
    const content = await findSiteContentByKey(key);
    return NextResponse.json(content);
  }

  const all = await findAllSiteContent();
  return NextResponse.json(all);
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { key, value } = await request.json();
  const payload =
    key === "social_links" && value && typeof value === "object"
      ? normalizeSocialLinks(value as Partial<SocialLinks>)
      : value;
  const content = await setSiteContent(key, payload);
  return NextResponse.json(content);
}
