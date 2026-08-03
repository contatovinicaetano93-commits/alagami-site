"use client";

import {
  CanvasTexture,
  Color,
  MathUtils,
  RepeatWrapping,
  SRGBColorSpace,
  LinearSRGBColorSpace,
} from "three";

type Rgb = [number, number, number];

function hash2(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function valueNoise(x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const a = hash2(x0, y0);
  const b = hash2(x0 + 1, y0);
  const c = hash2(x0, y0 + 1);
  const d = hash2(x0 + 1, y0 + 1);
  return MathUtils.lerp(MathUtils.lerp(a, b, u), MathUtils.lerp(c, d, u), v);
}

function fbm(x: number, y: number, octaves = 4): number {
  let value = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    value += valueNoise(x * freq, y * freq) * amp;
    amp *= 0.5;
    freq *= 2;
  }
  return value;
}

function fillNoise(
  size: number,
  paint: (x: number, y: number, n: number) => Rgb,
  alpha = 255,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = fbm(x / 48, y / 48, 5);
      const [r, g, b] = paint(x, y, n);
      const i = (y * size + x) * 4;
      img.data[i] = r;
      img.data[i + 1] = g;
      img.data[i + 2] = b;
      img.data[i + 3] = alpha;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function toMap(
  canvas: HTMLCanvasElement,
  repeat: [number, number],
  colorSpace: typeof SRGBColorSpace | typeof LinearSRGBColorSpace = SRGBColorSpace,
): CanvasTexture {
  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.colorSpace = colorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/** Concreto com agregado e junta de forma (contraste alto para ler no canvas). */
export function makeConcreteMap(): CanvasTexture {
  const canvas = fillNoise(512, (x, y, n) => {
    const aggregate = hash2(x * 0.7, y * 0.7) > 0.9 ? 38 : 0;
    const form = ((x + y * 0.15) % 64 < 1.6 ? -32 : 0) + ((y + x * 0.08) % 96 < 1.2 ? -18 : 0);
    const base = 140 + n * 55 + aggregate + form;
    return [
      MathUtils.clamp(base, 0, 255),
      MathUtils.clamp(base * 0.97, 0, 255),
      MathUtils.clamp(base * 0.92, 0, 255),
    ];
  });
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = i % 2 ? "#fff" : "#000";
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2 + Math.random() * 22, 1.5);
    }
    ctx.globalAlpha = 1;
  }
  return toMap(canvas, [2.4, 2.4]);
}

export function makeConcreteRoughnessMap(): CanvasTexture {
  const canvas = fillNoise(256, (_x, _y, n) => {
    const v = MathUtils.clamp(140 + n * 90, 40, 255);
    return [v, v, v];
  });
  return toMap(canvas, [2.4, 2.4], LinearSRGBColorSpace);
}

/** Solo de canteiro — terra + pedrisco. */
export function makeDirtMap(): CanvasTexture {
  const canvas = fillNoise(512, (x, y, n) => {
    const pebble = hash2(x, y) > 0.97 ? 40 : 0;
    const track = Math.abs(Math.sin(x * 0.04) * 18) * (n > 0.45 ? 1 : 0);
    const base = 68 + n * 42 + pebble - track;
    return [
      MathUtils.clamp(base + 8, 0, 255),
      MathUtils.clamp(base + 4, 0, 255),
      MathUtils.clamp(base - 6, 0, 255),
    ];
  });
  return toMap(canvas, [3.2, 3.2]);
}

/** Metal escovado sutil. */
export function makeMetalMap(): CanvasTexture {
  const canvas = fillNoise(256, (x, y, n) => {
    const brush = Math.sin(y * 0.9 + n * 2) * 10;
    const base = 118 + n * 22 + brush;
    return [
      MathUtils.clamp(base, 0, 255),
      MathUtils.clamp(base + 4, 0, 255),
      MathUtils.clamp(base + 10, 0, 255),
    ];
  });
  return toMap(canvas, [1.8, 1.8]);
}

export function makeWoodMap(): CanvasTexture {
  const canvas = fillNoise(256, (x, y, n) => {
    const grain = Math.sin(y * 0.35 + n * 4) * 16 + Math.sin(x * 0.05) * 4;
    const base = 120 + grain + n * 20;
    return [
      MathUtils.clamp(base + 20, 0, 255),
      MathUtils.clamp(base - 10, 0, 255),
      MathUtils.clamp(base - 40, 0, 255),
    ];
  });
  return toMap(canvas, [1.2, 2.5]);
}

export const PALETTE = {
  navy: new Color("#0C1A3D"),
  concrete: new Color("#C4CAD2"),
  warmConcrete: new Color("#D2C4B0"),
  steel: new Color("#9AA3B2"),
  darkSteel: new Color("#4A5260"),
  glass: new Color("#B4D0E4"),
  glassTint: new Color("#7FB0D0"),
  mint: new Color("#4ADE80"),
  mintDeep: new Color("#16A34A"),
  dirt: new Color("#7A8276"),
  wood: new Color("#A07A54"),
  warning: new Color("#F0C45A"),
  asphalt: new Color("#5A6068"),
} as const;
