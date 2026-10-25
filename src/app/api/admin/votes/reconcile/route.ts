import { NextRequest, NextResponse } from "next/server";
import { getVoteReconcileStats, syncAllCandidateVoteCounts } from "@/lib/db/models/payments";
import { adminForceFinalizePayment, reconcileVotePayments } from "@/lib/payments";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const postSchema = z.object({
  forceReferences: z.array(z.string().min(3)).optional(),
  limit: z.number().int().positive().max(2000).optional(),
});

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const stats = await getVoteReconcileStats();
  return NextResponse.json(stats);
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json().catch(() => ({}));
    const { forceReferences, limit } = postSchema.parse(body);
    const result = await reconcileVotePayments({ forceReferences, limit });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error("votes reconcile:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { reference } = z.object({ reference: z.string().min(3) }).parse(body);
    const result = await adminForceFinalizePayment(reference);
    await syncAllCandidateVoteCounts();
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
