import { NextRequest, NextResponse } from "next/server";
import { processWebhook } from "@/lib/payments";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-kkiapay-secret") || "";

    const result = await processWebhook(payload, signature);
    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { success: false, message: "Erreur interne" },
      { status: 500 }
    );
  }
}
