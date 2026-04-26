const fs = require("fs");

const inputPath = "dist/raw-snake.svg";
const outputDir = "dist-final";
const outputPath = `${outputDir}/snake-fire.svg`;

if (!fs.existsSync(inputPath)) {
  console.error("raw snake not found");
  process.exit(1);
}

let svg = fs.readFileSync(inputPath, "utf-8");

const durationMatch = svg.match(/animation:[^;]*?([\d]+)ms/);
const totalMs = durationMatch ? parseInt(durationMatch[1]) : 18500;
const burnPct = (3000 / totalMs) * 100;

// === 1. Modify cell keyframes: instant eat -> 3s burn trail ===
// Original: @keyframes cN{P%{fill:var(--cX)}T%,100%{fill:var(--ce)}}
// New: adds fire color phases (yellow flash -> orange -> red -> ember -> empty)
svg = svg.replace(
  /@keyframes (c[\da-f]+)\{([\d.]+)%\{fill:(var\(--c\d+\))\}([\d.]+)%,100%\{fill:var\(--ce\)\}\}/g,
  (_, name, startPct, origFill, transPct) => {
    const trans = parseFloat(transPct);
    const burn = Math.min(burnPct, 100 - trans - 0.5);
    const p = (frac) => (trans + burn * frac).toFixed(2);

    return `@keyframes ${name}{` +
      `${startPct}%{fill:${origFill}}` +
      `${transPct}%{fill:#ffff66}` +
      `${p(0.15)}%{fill:#ffcc00}` +
      `${p(0.3)}%{fill:#ff8800}` +
      `${p(0.5)}%{fill:#ff4400}` +
      `${p(0.7)}%{fill:#cc2200}` +
      `${p(0.85)}%{fill:#661100}` +
      `${p(1.0)}%{fill:var(--ce)}` +
      `100%{fill:var(--ce)}}`;
  }
);

// === 2. Inject enhanced fire SVG definitions ===
const fireDefs = `
<defs>
  <filter id="snakeFire" x="-100%" y="-100%" width="300%" height="300%">
    <feTurbulence type="fractalNoise" baseFrequency="0.015 0.04" numOctaves="3" result="noise">
      <animate attributeName="baseFrequency" values="0.015 0.04;0.025 0.06;0.01 0.03;0.015 0.04" dur="2s" repeatCount="indefinite"/>
    </feTurbulence>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" result="displaced"/>
    <feGaussianBlur in="displaced" stdDeviation="4" result="outerGlow"/>
    <feColorMatrix type="matrix" in="outerGlow" result="warmOuter"
      values="1.2 0.3 0 0 0  0.3 0.15 0 0 0  0 0 0 0 0  0 0 0 0.6 0"/>
    <feGaussianBlur in="displaced" stdDeviation="1.5" result="innerGlow"/>
    <feColorMatrix type="matrix" in="innerGlow" result="warmInner"
      values="1 0.5 0 0 0.2  0.5 0.3 0 0 0.05  0 0 0 0 0  0 0 0 0.8 0"/>
    <feMerge>
      <feMergeNode in="warmOuter"/>
      <feMergeNode in="warmInner"/>
      <feMergeNode in="displaced"/>
    </feMerge>
  </filter>

  <linearGradient id="fireGradient" x1="0%" y1="100%" x2="0%" y2="0%">
    <stop offset="0%" stop-color="#ff2200">
      <animate attributeName="stop-color" values="#ff2200;#ff4400;#ff2200" dur="1.5s" repeatCount="indefinite"/>
    </stop>
    <stop offset="35%" stop-color="#ff8800">
      <animate attributeName="stop-color" values="#ff8800;#ffaa22;#ff8800" dur="2s" repeatCount="indefinite"/>
    </stop>
    <stop offset="65%" stop-color="#ffcc00">
      <animate attributeName="stop-color" values="#ffcc00;#ffdd44;#ffcc00" dur="1.8s" repeatCount="indefinite"/>
    </stop>
    <stop offset="100%" stop-color="#ffffaa">
      <animate attributeName="stop-color" values="#ffffaa;#ffffff;#ffffcc;#ffffaa" dur="1s" repeatCount="indefinite"/>
    </stop>
  </linearGradient>
</defs>
`;

const fireStyle = `
<style>
  .s {
    fill: url(#fireGradient) !important;
    filter: url(#snakeFire) !important;
  }
  .u {
    fill: url(#fireGradient) !important;
  }
</style>
`;

const beforeInject = svg;
svg = svg.replace(/<svg\b([^>]*)>/, `<svg$1>${fireDefs}${fireStyle}`);

if (svg === beforeInject) {
  console.error("invalid svg root tag");
  process.exit(1);
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

fs.writeFileSync(outputPath, svg);
console.log("Fire snake generated successfully!");
