"use client";

import * as THREE from "three";

let cachedTexture: THREE.CanvasTexture | null = null;

export function getCircularParticleTexture(): THREE.CanvasTexture {
  if (cachedTexture) return cachedTexture;

  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.3, "rgba(255,255,255,0.8)");
  gradient.addColorStop(0.6, "rgba(255,255,255,0.3)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  cachedTexture = new THREE.CanvasTexture(canvas);
  return cachedTexture;
}
