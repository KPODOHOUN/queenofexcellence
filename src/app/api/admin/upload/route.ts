import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { saveMedia } from "@/lib/db/models/media";
import { detectImageType, MAX_IMAGE_SIZE, newMediaFilename } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const file = (await request.formData()).get("file");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "Fichier trop volumineux (maximum 10 Mo)." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = detectImageType(buffer);
    if (!mime) {
      return NextResponse.json({ error: "Format non supporté. Utilisez JPG, PNG, WebP ou GIF." }, { status: 400 });
    }

    const filename = newMediaFilename(mime);
    await saveMedia(filename, mime, buffer);
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (err) {
    console.error("Upload error:", err);
    const code = err instanceof Error && "code" in err ? String(err.code) : "";
    const message =
      code === "ER_NO_SUCH_TABLE"
        ? "Table « media » absente : importez database/migrations/add-media.sql dans phpMyAdmin."
        : code === "ER_NET_PACKET_TOO_LARGE"
          ? "Image trop lourde pour la base de données. Réduisez sa taille et réessayez."
          : "Erreur lors de l'enregistrement de l'image.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
