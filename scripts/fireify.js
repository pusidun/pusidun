const fs = require("fs");

// === 1️⃣ 读取原始 snake（只读） ===
const inputPath = "dist/raw-snake.svg";
const outputDir = "dist-final";
const outputPath = `${outputDir}/snake-fire.svg`;

if (!fs.existsSync(inputPath)) {
  console.error("❌ raw snake not found");
  process.exit(1);
}

const originalSvg = fs.readFileSync(inputPath, "utf-8");
let svg = originalSvg;

// === 2️⃣ 火焰定义（核心）===
const fireDefs = `
<defs>
  <!-- 火焰扰动 -->
  <filter id="fire">
    <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise"/>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="5"/>
    <feGaussianBlur stdDeviation="2" result="blur"/>
    <feMerge>
      <feMergeNode in="blur"/>
      <feMergeNode in="SourceGraphic"/>
    </feMerge>
  </filter>

  <!-- 火焰渐变 -->
  <linearGradient id="fireGradient" x1="0%" y1="0%" x2="100%" y2="0%">
    <stop offset="0%" stop-color="#ffff99"/>
    <stop offset="25%" stop-color="#ffcc00"/>
    <stop offset="50%" stop-color="#ff8800"/>
    <stop offset="75%" stop-color="#ff3300"/>
    <stop offset="100%" stop-color="#cc0000"/>
  </linearGradient>
</defs>
`;

const fireStyle = `
<style>
  .s {
    fill: url(#fireGradient) !important;
    filter: url(#fire) !important;
  }
</style>
`;

// === 3️⃣ 注入 defs 和样式 ===
svg = svg.replace(/<svg\b([^>]*)>/, `<svg$1>${fireDefs}${fireStyle}`);

if (svg === originalSvg) {
  console.error("❌ invalid svg root tag");
  process.exit(1);
}

// === 4️⃣ 创建输出目录（关键）===
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// === 5️⃣ 写入新文件 ===
fs.writeFileSync(outputPath, svg);

console.log("🔥 Fire snake generated successfully!");