import { NextRequest, NextResponse } from "next/server";
import { findPublicCategories } from "@/lib/db/models/categories";

export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get("eventId");
  if (!eventId) {
    return NextResponse.json({ error: "eventId requis" }, { status: 400 });
  }

  try {
    const categories = await findPublicCategories(eventId);
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Public categories:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
