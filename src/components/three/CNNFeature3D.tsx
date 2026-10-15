"use client";

import {
  useRef,
  useMemo,
  useCallback,
  type RefObject,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { hash01 } from "@/lib/random";

interface PlaneDef {
  name: string;
  domIdx: number;
  grid: number;
  color: string;
}

const PLANE_DEFS: PlaneDef[] = [
  { name: "INPUT", domIdx: 0, grid: 8, color: "#767E8C" },
  { name: "CONV2D", domIdx: 1, grid: 8, color: "#FF4500" },
  { name: "RELU", domIdx: 2, grid: 8, color: "#0E7A56" },
  { name: "MAXPOOL", domIdx: 3, grid: 4, color: "#2249C7" },
  { name: "DENSE", domIdx: 7, grid: 2, color: "#B45309" },
];

const SIZE = 1.6;
const GAP = 1.75;
const SPAN = (PLANE_DEFS.length - 1) * GAP;
const planeX = (i: number) => i * GAP - SPAN / 2;
const nxOf = (col: number, g: number) => (col + 0.5) / g;
const nyOf = (row: number, g: number) => (row + 0.5) / g;
const localX = (nx: number) => (nx - 0.5) * SIZE;
const localY = (ny: number) => (0.5 - ny) * SIZE;
const snap = (n: number, g: number) => Math.min(Math.floor(n * g), g - 1);

interface Pulse {
  p: number;
  seg: number;
  col: number;
  row: number;
  cycle: number;
  speed: number;
}

function makePulses(): Pulse[] {
  return Array.from({ length: 8 }, (_, i) => {
    const p = hash01(i * 7 + 1) * 4;
    const seg = Math.min(Math.floor(p), 3);
    const g = PLANE_DEFS[seg].grid;
    return {
      p,
      seg,
      col: Math.floor(hash01(i * 13 + 5) * g),
      row: Math.floor(hash01(i * 17 + 9) * g),
      cycle: i,
      speed: 0.85 + hash01(i * 23 + 3) * 0.7,
    };
  });
}

function buildCells(def: PlaneDef, x: number): THREE.InstancedMesh {
  const g = def.grid;
  const cell = (SIZE / g) * 0.78;
  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(cell, cell, 0.04),
    new THREE.MeshBasicMaterial({
      color: def.color,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      toneMapped: false,
    }),
    g * g
  );
  const m = new THREE.Matrix4();
  const c = new THREE.Color();
  let i = 0;
  for (let row = 0; row < g; row++) {
    for (let col = 0; col < g; col++) {
      m.setPosition(localX(nxOf(col, g)), localY(nyOf(row, g)), 0);
      mesh.setMatrixAt(i, m);
      c.set(def.color).multiplyScalar(0.35 + hash01(i * 3 + g * 17) * 0.65);
      mesh.setColorAt(i, c);
      i++;
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.position.x = x;
  mesh.frustumCulled = false;
  return mesh;
}

interface SceneProps {
  ptr: RefObject<{ x: number; y: number }>;
  drag: RefObject<{ on: boolean; hover: boolean; rotY: number }>;
  activeIdx: number;
  onSelect: (i: number) => void;
}

function Scene({ ptr, drag, activeIdx, onSelect }: SceneProps) {
  const rootRef = useRef<THREE.Group>(null);
  const cellMatsRef = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const baseMatsRef = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const borderMatsRef = useRef<(THREE.LineBasicMaterial | null)[]>([]);
  const connMatsRef = useRef<THREE.LineBasicMaterial | null>(null);
  const pulseRefs = useRef<(THREE.Mesh | null)[]>([]);
  const flashRef = useRef<number[]>([0, 0, 0, 0, 0]);
  const pulsesRef = useRef<Pulse[]>(makePulses());

  const planes = useMemo(
    () =>
      PLANE_DEFS.map((def, i) => {
        const x = planeX(i);
        const cells = buildCells(def, x);
        const border = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.PlaneGeometry(SIZE, SIZE)),
          new THREE.LineBasicMaterial({
            color: def.color,
            transparent: true,
            opacity: 0.35,
            toneMapped: false,
          })
        );
        border.position.x = x;
        return { def, cells, border, i };
      }),
    []
  );

  const connGeo = useMemo(() => {
    const pts: number[] = [];
    for (let s = 0; s < PLANE_DEFS.length - 1; s++) {
      const gL = PLANE_DEFS[s].grid;
      const gR = PLANE_DEFS[s + 1].grid;
      for (let row = 0; row < gL; row++) {
        for (let col = 0; col < gL; col++) {
          const nx = nxOf(col, gL);
          const ny = nyOf(row, gL);
          pts.push(planeX(s) + localX(nx), localY(ny), 0);
          const rc = snap(nx, gR);
          const rr = snap(ny, gR);
          pts.push(planeX(s + 1) + localX(nxOf(rc, gR)), localY(nyOf(rr, gR)), 0);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, []);

  const connMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#0B0F19",
        transparent: true,
        opacity: 0.16,
        blending: THREE.NormalBlending,
        toneMapped: false,
      }),
    []
  );

  const onPlaneClick = useCallback(
    (i: number, e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onSelect(PLANE_DEFS[i].domIdx);
    },
    [onSelect]
  );

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.05);
    const speedMul = (drag.current.hover ? 1.9 : 1) * (drag.current.on ? 1.5 : 1);

    const root = rootRef.current;
    if (root) {
      const targetY = ptr.current.x * 0.32 + drag.current.rotY;
      const targetX = -ptr.current.y * 0.18;
      const k = 1 - Math.exp(-6 * d);
      root.rotation.y += (targetY - root.rotation.y) * k;
      root.rotation.x += (targetX - root.rotation.x) * k;
    }

    const flash = flashRef.current;
    const pulses = pulsesRef.current;
    for (let i = 0; i < pulses.length; i++) {
      const pu = pulses[i];
      pu.p += pu.speed * speedMul * d * 0.55;
      let wrapped = false;
      if (pu.p >= 4) {
        pu.p -= 4;
        pu.cycle += 1;
        pu.col = Math.floor(hash01(pu.cycle * 97 + i * 31) * 8);
        pu.row = Math.floor(hash01(pu.cycle * 53 + i * 41) * 8);
        wrapped = true;
      }
      const s = Math.min(Math.floor(pu.p), 3);
      if (s !== pu.seg) {
        if (wrapped || pu.seg === 3) flash[4] = 1;
        if (s === pu.seg + 1) {
          const gL = PLANE_DEFS[pu.seg].grid;
          const gR = PLANE_DEFS[pu.seg + 1].grid;
          const nx = nxOf(pu.col, gL);
          const ny = nyOf(pu.row, gL);
          pu.col = snap(nx, gR);
          pu.row = snap(ny, gR);
        }
        flash[s] = 1;
        pu.seg = s;
      }

      const gL = PLANE_DEFS[s].grid;
      const gR = PLANE_DEFS[s + 1].grid;
      const nx = nxOf(pu.col, gL);
      const ny = nyOf(pu.row, gL);
      const rc = snap(nx, gR);
      const rr = snap(ny, gR);
      const t = pu.p - s;
      const x0 = planeX(s) + localX(nx);
      const y0 = localY(ny);
      const x1 = planeX(s + 1) + localX(nxOf(rc, gR));
      const y1 = localY(nyOf(rr, gR));
      const mesh = pulseRefs.current[i];
      if (mesh) mesh.position.set(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 0);
    }

    for (let i = 0; i < flash.length; i++) flash[i] = Math.max(0, flash[i] - d * 2.2);

    for (let i = 0; i < PLANE_DEFS.length; i++) {
      const active = PLANE_DEFS[i].domIdx === activeIdx;
      const f = flash[i];
      const cm = cellMatsRef.current[i];
      if (cm) cm.opacity = Math.min(1, 0.3 + (active ? 0.25 : 0) + f * 0.45);
      const bm = borderMatsRef.current[i];
      if (bm) bm.opacity = Math.min(1, 0.3 + (active ? 0.4 : 0) + f * 0.4);
      const baseM = baseMatsRef.current[i];
      if (baseM) baseM.opacity = 0.08 + (active ? 0.05 : 0) + f * 0.12;
    }

    const cl = connMatsRef.current;
    if (cl) {
      cl.opacity =
        0.16 +
        (drag.current.hover ? 0.1 : 0) +
        Math.sin(state.clock.elapsedTime * 1.6) * 0.03;
    }
  });

  return (
    <group ref={rootRef}>
      {planes.map((p, i) => (
        <group key={p.def.name}>
          <mesh
            position={[planeX(i), 0, 0]}
            onClick={(e) => onPlaneClick(i, e)}
            ref={(el) => {
              if (el) baseMatsRef.current[i] = el.material as THREE.MeshBasicMaterial;
            }}
          >
            <planeGeometry args={[SIZE, SIZE]} />
            <meshBasicMaterial
              color={p.def.color}
              transparent
              opacity={0.08}
              side={THREE.DoubleSide}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <primitive
            object={p.cells}
            onClick={(e: ThreeEvent<MouseEvent>) => onPlaneClick(i, e)}
            ref={(el: THREE.Mesh | null) => {
              if (el) cellMatsRef.current[i] = el.material as THREE.MeshBasicMaterial;
            }}
          />
          <primitive
            object={p.border}
            ref={(el: THREE.LineSegments | null) => {
              if (el) borderMatsRef.current[i] = el.material as THREE.LineBasicMaterial;
            }}
          />
        </group>
      ))}

      <lineSegments
        geometry={connGeo}
        material={connMat}
        ref={(el: THREE.LineSegments | null) => {
          if (el) connMatsRef.current = el.material as THREE.LineBasicMaterial;
        }}
      />

      {Array.from({ length: 8 }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) pulseRefs.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshBasicMaterial
            color="#FF4500"
            transparent
            opacity={0.95}
            blending={THREE.NormalBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* invisible hit plane: click fallback across the whole stage */}
      <mesh position={[0, 0, -1.2]}>
        <planeGeometry args={[SPAN + 5, 5]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function CNNFeature3D({
  activeIdx,
  onSelect,
}: {
  activeIdx: number;
  onSelect: (i: number) => void;
}) {
  const ptr = useRef({ x: 0, y: 0 });
  const drag = useRef({ on: false, hover: false, rotY: 0 });

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    ptr.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ptr.current.y = 1 - ((e.clientY - r.top) / r.height) * 2;
    if (drag.current.on && e.nativeEvent.movementX) {
      drag.current.rotY += e.nativeEvent.movementX * 0.006;
      drag.current.rotY = Math.max(-0.9, Math.min(0.9, drag.current.rotY));
    }
  };

  const onPointerEnter = () => {
    drag.current.hover = true;
  };
  const onPointerDown = () => {
    drag.current.on = true;
  };
  const onPointerUp = () => {
    drag.current.on = false;
  };
  const onPointerLeave = () => {
    drag.current.on = false;
    drag.current.hover = false;
    ptr.current.x = 0;
    ptr.current.y = 0;
  };

  return (
    <div
      className="absolute inset-0"
      onPointerMove={onPointerMove}
      onPointerEnter={onPointerEnter}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
    >
      <Canvas
        data-interactive="true"
        dpr={[1, 1.75]}
        camera={{ position: [1.8, 1.1, 6.9], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
      >
        <Scene ptr={ptr} drag={drag} activeIdx={activeIdx} onSelect={onSelect} />
      </Canvas>
    </div>
  );
}
