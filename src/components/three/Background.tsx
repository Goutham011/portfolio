"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const mouseScratch = new THREE.Vector2(0.5, 0.5);

const vertexShader = `#version 300 es
precision highp float;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const fragmentShader = `#version 300 es
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;

out vec4 fragColor;

// Simplex 3D Noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  
  float n_ = 1.0/7.0;
  vec3  ns = n_ * D.wyz - D.xzx;
  
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// Fractal Brownian Motion
float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 6; i++) {
    value += amplitude * snoise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return value;
}

// Voronoi noise for cellular pattern
float voronoi(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float minDist = 10.0;
  
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 point = fract(sin(i + neighbor + uTime * 0.1) * 43758.5453);
      float dist = distance(f, point + neighbor);
      minDist = min(minDist, dist);
    }
  }
  return minDist;
}

void main() {
  vec2 centeredUv = (gl_FragCoord.xy - 0.5 * uResolution) / min(uResolution.x, uResolution.y);
  vec2 mouseInfluence = (uMouse - 0.5) * 2.0;
  
  // Multiple noise layers
  float noise1 = fbm(vec3(centeredUv * 2.0 + uTime * 0.05, uTime * 0.1));
  float noise2 = fbm(vec3(centeredUv * 4.0 - uTime * 0.03, uTime * 0.07));
  float noise3 = fbm(vec3(centeredUv * 8.0 + uTime * 0.02, uTime * 0.15));
  
  // Voronoi cells
  float cells = voronoi(centeredUv * 10.0 + uTime * 0.02);
  cells = smoothstep(0.0, 0.3, cells);
  
  // Mouse influence
  float mouseDist = length(centeredUv - mouseInfluence);
  float mouseEffect = smoothstep(0.5, 0.0, mouseDist) * 0.5;
  
  // Combine noises
  float combined = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
  combined += cells * 0.3;
  combined += mouseEffect;
  
  // Color mixing
  vec3 color = mix(uColorC, uColorB, combined * 0.5);
  color = mix(color, uColorA, smoothstep(0.6, 1.0, combined) * mouseEffect * 2.0);
  
  // Add subtle grid lines
  float grid = max(
    abs(fract(centeredUv.x * 20.0) - 0.5) * 2.0,
    abs(fract(centeredUv.y * 20.0) - 0.5) * 2.0
  );
  grid = smoothstep(0.45, 0.5, grid) * 0.02;
  color += vec3(grid) * combined;
  
  // Vignette
  float vignette = 1.0 - length(centeredUv) * 0.5;
  color *= vignette;
  
  fragColor = vec4(color, 1.0);
}
`;

function BackgroundMesh({ mouse }: { mouse: [number, number] }) {
  const { size } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2() },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uColorA: { value: new THREE.Color(0xFF4500) },
        uColorB: { value: new THREE.Color(0xE4E7E6) },
        uColorC: { value: new THREE.Color(0xF2F4F3) },
      },
    });
    return mat;
  }, []);
  const geometry = useMemo(() => new THREE.PlaneGeometry(2, 2), []);

  useFrame((_, delta) => {
    const mat = meshRef.current?.material;
    if (mat instanceof THREE.ShaderMaterial) {
      mat.uniforms.uTime.value += delta;
      mat.uniforms.uResolution.value.set(size.width, size.height);
      mat.uniforms.uMouse.value.lerp(mouseScratch.set(mouse[0], mouse[1]), 0.05);
    }
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
}

export function Background() {
  const [mouse, setMouse] = useState<[number, number]>([0.5, 0.5]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setMouse([e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight]);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 1], fov: 50 }}
      style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: -1, pointerEvents: "none" }}
      gl={{ preserveDrawingBuffer: true, antialias: true, alpha: false }}
    >
      <BackgroundMesh mouse={mouse} />
    </Canvas>
  );
}