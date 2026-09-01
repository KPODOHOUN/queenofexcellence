import { NextRequest, NextResponse } from "next/server";
import { createTicketPayment, AppError } from "@/lib/payments";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { z } from "zod";

const ticketSchema = z.object({
  eventId: z.string(),
  items: z.array(
    z.object({
      ticketId: z.string(),
      quantity: z.number().min(1).max(10),
    })
  ).min(1),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, "tickets-purchase", { max: 10, windowMs: 60_000 });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfterSeconds);

  try {
    const body = await request.json();
    const data = ticketSchema.parse(body);
    const result = await createTicketPayment(data);
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
    console.error("Ticket purchase error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
