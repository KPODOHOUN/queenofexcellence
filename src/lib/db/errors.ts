import { NextResponse } from "next/server";

type DbErrorLike = Error & { code?: string; errno?: number };

export function isDbError(err: unknown): err is DbErrorLike {
  return err instanceof Error && "code" in err;
}

/** Réponse JSON pour erreurs MySQL dans les routes admin. */
export function dbErrorResponse(err: unknown, context = "Opération") {
  console.error(`[DB] ${context}:`, err);

  if (isDbError(err)) {
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "Cet enregistrement existe déjà (slug ou nom en double)." },
        { status: 409 }
      );
    }
    if (err.code === "ER_NO_SUCH_TABLE") {
      return NextResponse.json(
        {
          error:
            "Table MySQL manquante. Importez database/migrations/add-event-categories.sql dans phpMyAdmin, ou lancez : bash ~/queenofex/apply-migrations.sh",
        },
        { status: 500 }
      );
    }
    if (err.message) {
      return NextResponse.json({ error: `${context} : ${err.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ error: `${context} — erreur serveur` }, { status: 500 });
}

/** Nettoie les champs optionnels avant INSERT/UPDATE event. */
export function normalizeEventFields(
  data: Record<string, unknown>
): Record<string, unknown> {
  const out = { ...data };
  for (const key of ["image", "banner", "shortDesc", "time", "rules", "presentation"]) {
    if (out[key] === "") out[key] = null;
  }
  if (out.votePrice === undefined || out.votePrice === null) {
    out.votePrice = 500;
  }
  return out;
}
