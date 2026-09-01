import { NextRequest, NextResponse } from "next/server";
import { createVotePayment, AppError } from "@/lib/payments";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { z } from "zod";

const voteSchema = z.object({
  eventId: z.string(),
  candidateId: z.string(),
  voteCount: z.number().min(1).max(100),
  voterName: z.string().min(2),
  voterEmail: z.string().email(),
  voterPhone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, "votes", { max: 10, windowMs: 60_000 });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfterSeconds);

  try {
    const body = await request.json();
    const data = voteSchema.parse(body);
    const result = await createVotePayment(data);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Vote error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
