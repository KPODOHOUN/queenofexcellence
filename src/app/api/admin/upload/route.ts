import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { mkdir, writeFile } from "fs/promises";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_SIZE = 5 * 1024 * 1024;

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

type UploadBlob = Blob & { name?: string; size: number; type?: string };

function isUploadBlob(value: unknown): value is UploadBlob {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    typeof (value as Blob).arrayBuffer === "function"
  );
}

function detectImageType(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return "image/gif";
  }

  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

function getUploadRoot(): string {
  return process.env.APP_ROOT || process.cwd();
}

/** Dossiers où écrire les uploads (LWS : Apache sert public_html/uploads). */
function getUploadDirs(): string[] {
  const root = getUploadRoot();
  const dirs = [path.join(root, "public", "uploads")];

  const publicHtmlUploads = path.join(root, "..", "public_html", "uploads");
  try {
    const publicHtmlRoot = path.join(root, "..", "public_html");
    if (fs.existsSync(publicHtmlRoot)) {
      dirs.push(path.normalize(publicHtmlUploads));
    }
  } catch {
    /* ignore */
  }

  const extra = process.env.UPLOAD_MIRROR_DIR?.trim();
  if (extra) dirs.push(path.resolve(root, extra));

  return [...new Set(dirs)];
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!isUploadBlob(file)) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
    }

    const size = file.size ?? 0;
    if (size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (maximum 5 Mo)." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const actualType = detectImageType(buffer);

    if (!actualType || !ALLOWED_TYPES.has(actualType)) {
      return NextResponse.json(
        { error: "Format non supporté. Utilisez JPG, PNG, WebP ou GIF." },
        { status: 400 }
      );
    }

    const ext = EXT_MAP[actualType] || "jpg";
    const filename = `${randomUUID()}.${ext}`;

    for (const uploadDir of getUploadDirs()) {
      await mkdir(uploadDir, { recursive: true, mode: 0o777 });
      await writeFile(path.join(uploadDir, filename), buffer, { mode: 0o666 });
    }

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (err) {
    console.error("Upload error:", err);
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    const code = err instanceof Error && "code" in err ? String(err.code) : "";
    return NextResponse.json(
      {
        error: `Erreur upload: ${msg}${code ? ` (${code})` : ""}`,
      },
      { status: 500 }
    );
  }
}
