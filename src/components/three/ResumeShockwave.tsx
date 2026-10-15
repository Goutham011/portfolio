"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { hash01 } from "@/lib/random";

const COUNT = 54;

/**
 * One-shot particle shockwave that fires when the resume finishes
 * compiling: orange/ink/green squares burst outward with velocity
 * damping, then the whole scene unmounts (parent-controlled lifetime).
 */
function Burst() {
  const pointsRef = useRef<THREE.Points>(null);
  const lifeRef = useRef(1);
  const velRef = useRef((() => {
    const v = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const a = hash01(i * 3 + 1) * Math.PI * 2;
      const e = (hash01(i * 5 + 2) - 0.5) * Math.PI * 0.9;
      const sp = 2.4 + hash01(i * 7 + 3) * 3.4;
      v[i * 3] = Math.cos(a) * Math.cos(e) * sp;
      v[i * 3 + 1] = Math.sin(e) * sp;
      v[i * 3 + 2] = Math.sin(a) * Math.cos(e) * sp * 0.4;
    }
    return v;
  })());

  const { geo, mat } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const orange = new THREE.Color("#FF4500");
    const ink = new THREE.Color("#0B0F19");
    const green = new THREE.Color("#0E7A56");
    for (let i = 0; i < COUNT; i++) {
      const c = i % 6 === 0 ? green : i % 3 === 0 ? ink : orange;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const m = new THREE.PointsMaterial({
      size: 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.NormalBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    return { geo: g, mat: m };
  }, []);

  useEffect(() => {
    return () => {
      geo.dispose();
      mat.dispose();
    };
  }, [geo, mat]);

  useFrame((_, delta) => {
    const life = lifeRef.current;
    if (life <= 0) return;
    const d = Math.min(delta, 0.05);
    lifeRef.current = life - d * 1.15;
    const pts = pointsRef.current;
    if (!pts) return;
    const attr = pts.geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const vel = velRef.current;
    for (let i = 0; i < COUNT * 3; i++) {
      arr[i] += vel[i] * d;
      vel[i] *= 1 - 2.6 * d;
    }
    attr.needsUpdate = true;
    (pts.material as THREE.PointsMaterial).opacity = Math.max(0, lifeRef.current);
    if (lifeRef.current <= 0) pts.visible = false;
  });

  return <points ref={pointsRef} geometry={geo} material={mat} frustumCulled={false} />;
}

export function ResumeShockwave() {
  return (
    <div className="absolute inset-0 z-30 pointer-events-none" aria-hidden="true">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 6], fov: 50 }}
        style={{ width: "100%", height: "100%" }}
      >
        <Burst />
      </Canvas>
    </div>
  );
}
