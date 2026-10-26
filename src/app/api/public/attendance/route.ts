import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  addAttendance,
  getAttendance,
  isEventOpenForAttendance,
  removeAttendance,
} from "@/lib/db/models/attendance";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const bodySchema = z.object({
  eventId: z.string().min(1).max(36),
  token: z.string().min(16).max(64),
});

function unavailable(error: unknown) {
  // Table absente (migration non appliquée) ou base indisponible : le bouton se masque côté client.
  console.error("attendance:", error);
  return NextResponse.json({ error: "Indisponible" }, { status: 503 });
}

/** GET ?eventId=…&token=… → { count, attending } */
export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get("eventId");
  const token = request.nextUrl.searchParams.get("token") ?? undefined;
  if (!eventId) return NextResponse.json({ error: "eventId requis" }, { status: 400 });
  try {
    return NextResponse.json(await getAttendance(eventId, token));
  } catch (error) {
    return unavailable(error);
  }
}

/** POST { eventId, token } : « J'y serai ». DELETE : annuler. */
async function toggle(request: NextRequest, attend: boolean) {
  const limit = checkRateLimit(request, "attendance", { max: 20, windowMs: 60_000 });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  const { eventId, token } = parsed.data;

  try {
    if (!(await isEventOpenForAttendance(eventId))) {
      return NextResponse.json({ error: "Événement indisponible" }, { status: 404 });
    }
    if (attend) await addAttendance(eventId, token);
    else await removeAttendance(eventId, token);
    return NextResponse.json(await getAttendance(eventId, token));
  } catch (error) {
    return unavailable(error);
  }
}

export async function POST(request: NextRequest) {
  return toggle(request, true);
}

export async function DELETE(request: NextRequest) {
  return toggle(request, false);
}
