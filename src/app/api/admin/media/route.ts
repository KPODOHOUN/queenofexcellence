import { readdir, readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getMediaStats, saveMedia } from "@/lib/db/models/media";
import { detectImageType, MAX_IMAGE_SIZE, MEDIA_FILENAME } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const uploadsDir = () => path.join(process.env.APP_ROOT || process.cwd(), "public", "uploads");

async function diskFiles() {
  const names = await readdir(uploadsDir()).catch(() => [] as string[]);
  return names.filter((n) => MEDIA_FILENAME.test(n) && !n.startsWith("."));
}

/** État : images en base / fichiers encore sur le serveur. */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    return NextResponse.json({ ...(await getMediaStats()), onDisk: (await diskFiles()).length });
  } catch (err) {
    console.error("media stats:", err);
    return NextResponse.json({ error: "Table « media » absente : importez database/migrations/add-media.sql." }, { status: 503 });
  }
}

/**
 * Import dans la base, sans changer les chemins des contenus :
 * - sans fichier joint : tous les fichiers de public/uploads ;
 * - avec un fichier (sauvegarde) : ce fichier, sous son nom d'origine.
 */
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    const sources: { name: string; read: () => Promise<Buffer> }[] =
      file instanceof File
        ? [{ name: file.name, read: async () => Buffer.from(await file.arrayBuffer()) }]
        : (await diskFiles()).map((name) => ({ name, read: () => readFile(path.join(uploadsDir(), name)) }));

    let imported = 0;
    let skipped = 0;
    for (const source of sources) {
      const buffer = await source.read();
      const mime = detectImageType(buffer);
      if (!mime || buffer.length > MAX_IMAGE_SIZE || !MEDIA_FILENAME.test(source.name)) {
        skipped++;
        continue;
      }
      if (await saveMedia(source.name, mime, buffer)) imported++;
    }
    return NextResponse.json({ imported, skipped, ...(await getMediaStats()) });
  } catch (err) {
    console.error("media import:", err);
    return NextResponse.json({ error: "Import impossible. Vérifiez que la table « media » existe." }, { status: 500 });
  }
}
