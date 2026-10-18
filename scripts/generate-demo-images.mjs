// Generates soft, abstract placeholder photos (food-like tones, no people) into public/demo/.
// They stand in for real photos until the owner uploads her own in the admin panel.
// Run: node scripts/generate-demo-images.mjs

import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT = path.join(process.cwd(), "public", "demo");

// Each palette: background gradient + blobs [cx%, cy%, r%, color]
const PALETTES = {
  pistachio: { bg: ["#eceee4", "#c7ccb6"], blobs: [[50, 62, 30, "#faf5ec"], [50, 58, 22, "#e2d4bd"], [50, 40, 9, "#a3ad86"], [30, 25, 6, "#c94f5c"]] },
  chocolate: { bg: ["#ece2d9", "#c8ad9c"], blobs: [[42, 52, 28, "#3b2420"], [42, 52, 20, "#5b382c"], [68, 30, 6, "#a8454c"], [74, 70, 8, "#e9d9c8"]] },
  berry: { bg: ["#efe2e2", "#c9a7ad"], blobs: [[36, 60, 18, "#5e2f3a"], [64, 42, 12, "#8e4d5a"], [52, 50, 30, "#f6eeec"], [52, 50, 22, "#e3cfcf"]] },
  vanilla: { bg: ["#f6eeec", "#e3cfcf"], blobs: [[50, 50, 30, "#ffffff"], [50, 50, 20, "#f1e6e6"], [26, 26, 7, "#d9b8bd"], [74, 72, 6, "#d9b8bd"]] },
  caramel: { bg: ["#f5ecdc", "#dcc6a0"], blobs: [[58, 46, 24, "#d4b06a"], [58, 46, 14, "#e9cf8f"], [28, 72, 10, "#7a4a2a"]] },
  savory: { bg: ["#e9e4d3", "#c9bd98"], blobs: [[30, 38, 11, "#d9b36a"], [62, 55, 14, "#8aa05b"], [45, 76, 8, "#c4573a"], [72, 26, 7, "#f3ecd8"]] },
  greens: { bg: ["#e5e9da", "#b2bd96"], blobs: [[36, 56, 16, "#5f7843"], [66, 42, 12, "#93a86a"], [52, 74, 9, "#f3ecd8"]] },
  citrus: { bg: ["#f3e8cf", "#d8c08f"], blobs: [[55, 45, 16, "#e9a849"], [55, 45, 10, "#f2c46f"], [30, 70, 9, "#6f8a46"]] },
  cream: { bg: ["#faf6ef", "#e7dccb"], blobs: [[50, 54, 32, "#ffffff"], [50, 54, 24, "#f2e7d6"], [62, 40, 6, "#b0916a"]] },
};

function svg(width, height, palette) {
  const p = PALETTES[palette];
  const min = Math.min(width, height);
  const blobs = p.blobs
    .map(([cx, cy, r, color]) => {
      const x = (cx / 100) * width;
      const y = (cy / 100) * height;
      const radius = (r / 100) * min * 1.6;
      return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}" />`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${p.bg[0]}" /><stop offset="1" stop-color="${p.bg[1]}" />
      </linearGradient>
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${min / 40}" /></filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)" />
    <g filter="url(#soft)">${blobs}</g>
  </svg>`;
}

const IMAGES = [
  // [file, width, height, palette]
  ["hero-1", 1920, 1100, "chocolate"],
  ["hero-2", 1920, 1100, "pistachio"],
  ["hero-3", 1920, 1100, "berry"],
  ...Object.keys(PALETTES).map((name) => [`photo-${name}`, 1000, 1250, name]),
  ["about", 1200, 1500, "cream"],
  ["kashrut-certificate", 1200, 1600, "cream"],
];

await mkdir(OUT, { recursive: true });
for (const [file, w, h, palette] of IMAGES) {
  await sharp(Buffer.from(svg(w, h, palette))).webp({ quality: 82 }).toFile(path.join(OUT, `${file}.webp`));
  console.log(`demo/${file}.webp`);
}
