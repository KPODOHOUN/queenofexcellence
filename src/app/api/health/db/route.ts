import { NextResponse } from "next/server";
import { getPoolConfig, isDatabaseConfigured, queryOne } from "@/lib/db/connection";
import type { RowDataPacket } from "mysql2/promise";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const checkKey = process.env.HEALTH_CHECK_KEY?.trim();
  if (checkKey) {
    const url = new URL(request.url);
    if (url.searchParams.get("key") !== checkKey) {
      return NextResponse.json({ ok: false, error: "Clé de vérification invalide" }, { status: 401 });
    }
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      ok: false,
      database: {
        configured: false,
        connected: false,
        hint: "DATABASE_URL manquante dans .env ou variables cPanel",
      },
    });
  }

  const cfg = getPoolConfig();
  const database = cfg.database ?? null;
  const user = cfg.user ?? null;

  try {
    const adminRow = await queryOne<RowDataPacket & { c: number }>(
      "SELECT COUNT(*) AS c FROM `admin`"
    );
    const eventRow = await queryOne<RowDataPacket & { c: number }>(
      "SELECT COUNT(*) AS c FROM `event`"
    );

    return NextResponse.json({
      ok: true,
      database: {
        configured: true,
        connected: true,
        name: database,
        user,
        adminAccounts: Number(adminRow?.c ?? 0),
        events: Number(eventRow?.c ?? 0),
      },
      message: "Base de données connectée",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({
      ok: false,
      database: {
        configured: true,
        connected: false,
        name: database,
        user,
        error: message,
        hint:
          message.includes("Access denied")
            ? "Mot de passe ou utilisateur incorrect — vérifiez DATABASE_URL (@ du mot de passe → %40)"
            : "Vérifiez DATABASE_URL et redémarrez l'app Node.js",
      },
    });
  }
}
