/** Outils purs sur les pixels RGBA d'un cadre « J'y serai ». */

export type Box = { x: number; y: number; width: number; height: number };

type Pixels = { data: Uint8ClampedArray; width: number; height: number };

/** Boîte englobant la plus grande zone transparente du cadre, ou null si elle est trop petite. */
export function findTransparentZone({ data, width, height }: Pixels): Box | null {
  const seen = new Uint8Array(width * height);
  const stack = new Int32Array(width * height);
  let best: (Box & { area: number }) | null = null;

  for (let start = 0; start < width * height; start++) {
    if (seen[start] || data[start * 4 + 3] >= 128) continue;
    let sp = 0;
    stack[sp++] = start;
    seen[start] = 1;
    let area = 0;
    let minX = width, maxX = 0, minY = height, maxY = 0;
    while (sp > 0) {
      const p = stack[--sp];
      const x = p % width;
      const y = (p - x) / width;
      area++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      for (const n of [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, y > 0 ? p - width : -1, y < height - 1 ? p + width : -1]) {
        if (n >= 0 && !seen[n] && data[n * 4 + 3] < 128) {
          seen[n] = 1;
          stack[sp++] = n;
        }
      }
    }
    if (!best || area > best.area) {
      best = { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1, area };
    }
  }

  // Moins de 2 % de l'image : ce n'est pas une zone photo (coins arrondis, antialiasing…).
  if (!best || best.area < width * height * 0.02) return null;
  const { x, y, width: w, height: h } = best;
  return { x, y, width: w, height: h };
}
