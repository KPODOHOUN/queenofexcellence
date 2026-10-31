import { describe, expect, it } from "vitest";
import { findTransparentZone } from "@/lib/frame/zone";

/** Image 100×100 opaque ; `hole` rend transparent le rectangle (20,30)-(79,69). */
function frame(hole: boolean) {
  const width = 100;
  const height = 100;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data[(y * width + x) * 4 + 3] = hole && x >= 20 && x < 80 && y >= 30 && y < 70 ? 0 : 255;
    }
  }
  return { data, width, height };
}

describe("zone photo du cadre", () => {
  it("un cadre opaque n'a pas de zone", () => {
    expect(findTransparentZone(frame(false))).toBeNull();
  });

  it("détecte la boîte de la zone transparente", () => {
    expect(findTransparentZone(frame(true))).toEqual({ x: 20, y: 30, width: 60, height: 40 });
  });

  it("de petits trous (moins de 2 %) ne comptent pas comme une zone", () => {
    const f = frame(false);
    f.data[3] = 0;
    expect(findTransparentZone(f)).toBeNull();
  });
});
