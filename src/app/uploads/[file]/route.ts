import { NextRequest, NextResponse } from "next/server";
import { findMedia } from "@/lib/db/models/media";
import { MEDIA_FILENAME } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Sert une image stockée en base. Un fichier encore présent dans public/uploads reste prioritaire. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!MEDIA_FILENAME.test(file)) return new NextResponse(null, { status: 404 });

  const media = await findMedia(file).catch((error) => {
    console.error("media:", error);
    return null;
  });
  if (!media) return new NextResponse(null, { status: 404 });

  // Le nom est unique et l'image ne change jamais : le navigateur et le CDN la gardent en cache.
  return new NextResponse(new Uint8Array(media.data), {
    headers: {
      "Content-Type": media.mime,
      "Content-Length": String(media.data.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
