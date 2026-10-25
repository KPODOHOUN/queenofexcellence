import { NextRequest, NextResponse } from "next/server";
import { confirmPaymentByTransaction } from "@/lib/payments";
import { z } from "zod";

const schema = z.object({
  reference: z.string().min(3),
  transactionId: z.string().min(3),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference, transactionId } = schema.parse(body);
    const result = await confirmPaymentByTransaction(reference, transactionId);
    return NextResponse.json(result, {
      status: result.verified ? 200 : 202,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }
    console.error("KKiaPay confirm:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
