/**
 * Images /uploads/* : servies directement (Apache/Node), sans passer par
 * /_next/image — beaucoup plus rapide sur hébergement mutualisé LWS.
 */
type LoaderProps = {
  src: string;
  width: number;
  quality?: number;
};

function isDirectAsset(src: string): boolean {
  return (
    src.startsWith("/uploads/") ||
    src.startsWith("/logo") ||
    src.startsWith("/favicon") ||
    src.startsWith("/apple-touch")
  );
}

export default function siteImageLoader({
  src,
  width,
  quality,
}: LoaderProps): string {
  if (isDirectAsset(src)) return src;

  const q = quality ?? 75;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${q}`;
}
