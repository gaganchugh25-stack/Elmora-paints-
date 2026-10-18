/** Photo-derived wall mattes: spatial wall bounds + colour/difference gates protect foreground objects. */
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
mkdirSync("public/visualiser", { recursive: true });
const W = 1672,
  H = 941;
const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
function inside(x, y, points) {
  let hit = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i],
      [xj, yj] = points[j];
    if (yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      hit = !hit;
  }
  return hit;
}
const before = await sharp("Unpainted living room.png")
  .removeAlpha()
  .raw()
  .toBuffer();
const painted = await sharp("elmora-living-room.png")
  .removeAlpha()
  .raw()
  .toBuffer();
const bedroom = await sharp("Bedroom.png").removeAlpha().raw().toBuffer();
for (const room of ["living", "bedroom"]) {
  const data = room === "living" ? before : bedroom;
  const mask = Buffer.alloc(W * H);
  const boundary =
    room === "living"
      ? [
          [1278, 0],
          [1672, 0],
          [1672, 553],
          [1380, 527],
          [1370, 557],
          [1278, 557],
        ]
      : [
          [866, 104],
          [1202, 0],
          [1672, 0],
          [1672, 557],
          [1485, 551],
          [1485, 450],
          [1476, 442],
          [978, 442],
          [968, 510],
          [866, 510],
        ];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!inside(x, y, boundary)) continue;
      if (
        room === "living" &&
        inside(x, y, [
          [1524, 142],
          [1672, 60],
          [1672, 482],
          [1526, 480],
        ])
      )
        continue;
      const i = (y * W + x) * 3;
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      let alpha;
      if (room === "living") {
        const difference = Math.max(
          Math.abs(r - painted[i]),
          Math.abs(g - painted[i + 1]),
          Math.abs(b - painted[i + 2]),
        );
        alpha =
          smooth(23, 65, difference) * smooth(0.6, 0.81, b / Math.max(1, r));
      } else {
        alpha =
          smooth(0.66, 0.83, b / Math.max(1, r)) *
          smooth(0.79, 0.95, g / Math.max(1, r));
      }
      mask[y * W + x] = Math.round(alpha * 255);
    }
  await sharp(data, { raw: { width: W, height: H, channels: 3 } })
    .resize(1280, 720, { fit: "fill" })
    .webp({ quality: 88 })
    .toFile(`public/visualiser/${room}.webp`);
  await sharp(mask, { raw: { width: W, height: H, channels: 1 } })
    .resize(1280, 720, { fit: "fill" })
    .blur(0.35)
    .png()
    .toFile(`public/visualiser/${room}-mask.png`);
}
writeFileSync(
  "public/visualiser/README.txt",
  "Generated from supplied photographs. Wall mattes use spatial bounds and photo-derived pixel selection to exclude artwork, furniture and plants. Rebuild with node scripts/build-visualiser.mjs. Displayed paint colours are illustrative, not calibrated product shades.",
);
