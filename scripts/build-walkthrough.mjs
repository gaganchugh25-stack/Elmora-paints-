/** Build the seek-optimised desktop walkthrough from the supplied scene clips. */
import { spawnSync } from "node:child_process";
import { existsSync, statSync, writeFileSync } from "node:fs";

const bundled = "node_modules/@ffmpeg-installer/darwin-arm64/ffmpeg";
const ffmpeg =
  process.env.FFMPEG_PATH || (existsSync(bundled) ? bundled : "ffmpeg");
const sources = [
  "scene-01.mp4",
  "Scene-02.mp4",
  "Scene-03.mp4",
  "Scene-04.mp4",
  "Scene-05.mp4",
  "scene-06.mp4",
];
const output = "public/walkthrough/elmora-journey-sharp.mp4";

for (const source of sources) {
  if (!existsSync(source))
    throw new Error(`Missing supplied source: ${source}`);
}

const inputs = sources.flatMap((source) => ["-i", source]);
const videoInputs = sources.map((_, index) => `[${index}:v]`).join("");
const result = spawnSync(
  ffmpeg,
  [
    "-hide_banner",
    "-loglevel",
    "error",
    ...inputs,
    "-filter_complex",
    `${videoInputs}concat=n=${sources.length}:v=1:a=0,scale=1600:900:flags=lanczos,fps=24,format=yuv420p[v]`,
    "-map",
    "[v]",
    "-an",
    "-c:v",
    "libx264",
    "-profile:v",
    "high",
    "-crf",
    "18",
    "-preset",
    "slow",
    "-g",
    "3",
    "-keyint_min",
    "3",
    "-sc_threshold",
    "0",
    "-movflags",
    "+faststart",
    "-y",
    output,
  ],
  { stdio: "inherit" },
);

if (result.status !== 0) throw new Error("FFmpeg walkthrough build failed");

const manifest = {
  asset: output,
  sources,
  width: 1600,
  height: 900,
  framesPerSecond: 24,
  durationSeconds: 40,
  keyframeInterval: 3,
  bytes: statSync(output).size,
};
writeFileSync(
  "public/walkthrough/manifest.json",
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(
  `Walkthrough: ${(manifest.bytes / 1024 / 1024).toFixed(2)} MiB, ${manifest.width} x ${manifest.height}`,
);
