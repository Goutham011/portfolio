"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "@/lib/hooks";
import { hash01 } from "@/lib/random";
import { getCircularParticleTexture } from "@/lib/particleTexture";

/* ------------------------------------------------------------------ */
/*  Neural Synapse Network — node & edge graph reacting to cursor      */
/* ------------------------------------------------------------------ */

const LAYERS = [5, 8, 10, 8, 3];
const LAYER_COLORS = ["#FF4500", "#2249C7", "#0E7A56", "#B45309", "#FF4500"];

interface SynapseNode {
  x: number;
  y: number;
  z: number;
  layer: number;
}

function NeuralSynapse() {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const { pointer } = useThree();

  const { nodes, edges, nodeGeo, edgeGeo, nodeMat, edgeMat } =
    useMemo(() => {
      const spacing = 1.6;
      const totalWidth = (LAYERS.length - 1) * spacing;
      const nodes: SynapseNode[] = [];
      const layerOffsets: number[][] = [];

      LAYERS.forEach((count, layer) => {
        const offset: number[] = [];
        for (let i = 0; i < count; i++) {
          const y = (i - (count - 1) / 2) * 0.55;
          const x = layer * spacing - totalWidth / 2;
          const z = Math.sin(layer * 1.2 + i) * 0.3;
          const idx = nodes.length;
          offset.push(idx);
          nodes.push({ x, y, z, layer });
        }
        layerOffsets.push(offset);
      });

      const edges: [number, number][] = [];
      for (let l = 0; l < layerOffsets.length - 1; l++) {
        for (const a of layerOffsets[l]) {
          for (const b of layerOffsets[l + 1]) {
            if (hash01(a * 1000 + b * 7 + l) > 0.35) edges.push([a, b]);
          }
        }
      }

      const nodePos = new Float32Array(nodes.length * 3);
      const nodeCol = new Float32Array(nodes.length * 3);
      nodes.forEach((n, i) => {
        nodePos[i * 3] = n.x;
        nodePos[i * 3 + 1] = n.y;
        nodePos[i * 3 + 2] = n.z;
        const c = new THREE.Color(LAYER_COLORS[n.layer]);
        nodeCol[i * 3] = c.r;
        nodeCol[i * 3 + 1] = c.g;
        nodeCol[i * 3 + 2] = c.b;
      });

      const nodeGeo = new THREE.BufferGeometry();
      nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePos, 3));
      nodeGeo.setAttribute("color", new THREE.BufferAttribute(nodeCol, 3));

      const edgePos = new Float32Array(edges.length * 6);
      const edgeCol = new Float32Array(edges.length * 6);
      edges.forEach(([a, b], i) => {
        const na = nodes[a];
        const nb = nodes[b];
        edgePos.set([na.x, na.y, na.z, nb.x, nb.y, nb.z], i * 6);
        const ca = new THREE.Color(LAYER_COLORS[na.layer]);
        const cb = new THREE.Color(LAYER_COLORS[nb.layer]);
        edgeCol.set([ca.r, ca.g, ca.b, cb.r, cb.g, cb.b], i * 6);
      });

      const edgeGeo = new THREE.BufferGeometry();
      edgeGeo.setAttribute("position", new THREE.BufferAttribute(edgePos, 3));
      edgeGeo.setAttribute("color", new THREE.BufferAttribute(edgeCol, 3));

      const nodeMat = new THREE.PointsMaterial({
        size: 0.1,
        color: 0xff4500,
        transparent: true,
        opacity: 0.95,
        map: getCircularParticleTexture(),
        blending: THREE.NormalBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });

      const edgeMat = new THREE.LineBasicMaterial({
        color: 0x0b0f19,
        transparent: true,
        opacity: 0.16,
        blending: THREE.NormalBlending,
        depthWrite: false,
      });

      return {
        nodes,
        edges,
        nodeGeo,
        edgeGeo,
        nodeMat,
        edgeMat,
      };
    }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (groupRef.current) {
      groupRef.current.rotation.y =
        THREE.MathUtils.lerp(groupRef.current.rotation.y, pointer.x * 0.3, 0.05);
      groupRef.current.rotation.x =
        THREE.MathUtils.lerp(groupRef.current.rotation.x, -pointer.y * 0.15, 0.05);
    }

    const pos = pointsRef.current?.geometry.attributes.position as
      | THREE.BufferAttribute
      | undefined;
    if (pos) {
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        pos.setY(i, n.y + Math.sin(t * 0.8 + i * 0.7) * 0.04);
      }
      pos.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      <lineSegments geometry={edgeGeo} material={edgeMat} frustumCulled={false} />
      <points ref={pointsRef} geometry={nodeGeo} material={nodeMat} frustumCulled={false} />
      <SynapsePulses nodes={nodes} edges={edges} />
    </group>
  );
}

function SynapsePulses({
  nodes,
  edges,
}: {
  nodes: SynapseNode[];
  edges: [number, number][];
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const dataRef = useRef({
    progress: new Float32Array(24).map((_, i) => hash01(i)),
    edgeIdx: new Float32Array(24).map((_, i) =>
      Math.floor(hash01(i * 3 + 1) * edges.length)
    ),
    speed: new Float32Array(24).map((_, i) => 0.3 + hash01(i * 7 + 2) * 0.5),
  });

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(24 * 3), 3));
    const cols = new Float32Array(24 * 3);
    for (let i = 0; i < 24; i++) {
      const c = new THREE.Color(LAYER_COLORS[i % LAYER_COLORS.length]);
      cols.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    return g;
  }, []);

  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.14,
        color: 0xff4500,
        transparent: true,
        opacity: 0.95,
        map: getCircularParticleTexture(),
        blending: THREE.NormalBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    []
  );

  useFrame((_, delta) => {
    const pts = pointsRef.current;
    if (!pts) return;
    const { progress, edgeIdx, speed } = dataRef.current;
    const pos = pts.geometry.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < 24; i++) {
      progress[i] += speed[i] * delta;
      if (progress[i] > 1) {
        progress[i] = 0;
        edgeIdx[i] = Math.floor(Math.random() * edges.length);
      }
      const [a, b] = edges[edgeIdx[i]];
      const na = nodes[a];
      const nb = nodes[b];
      const p = progress[i];
      pos.setXYZ(i, na.x + (nb.x - na.x) * p, na.y + (nb.y - na.y) * p, na.z + (nb.z - na.z) * p);
    }
    pos.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geo} material={mat} frustumCulled={false} />;
}

/* ------------------------------------------------------------------ */
/*  Ambient dust particles                                             */
/* ------------------------------------------------------------------ */

function AmbientDust({ count = 60 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.01;
    }
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (hash01(i * 3 + 1) - 0.5) * 20;
      positions[i * 3 + 1] = (hash01(i * 3 + 2) - 0.5) * 12;
      positions[i * 3 + 2] = (hash01(i * 3 + 3) - 0.5) * 10 - 4;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.08,
        color: 0xFF4500,
        map: getCircularParticleTexture(),
        transparent: true,
        opacity: 0.25,
        alphaTest: 0.01,
        blending: THREE.NormalBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    []
  );

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

/* ------------------------------------------------------------------ */
/*  Telemetry HUD panel (DOM)                                          */
/* ------------------------------------------------------------------ */

function useTelemetry() {
  const [gpu, setGpu] = useState(62);
  const [latency, setLatency] = useState(12);
  const [fps, setFps] = useState(120);

  useEffect(() => {
    const iv = setInterval(() => {
      setGpu((g) => Math.min(95, Math.max(40, g + (Math.random() - 0.5) * 8)));
      setLatency((l) => Math.min(30, Math.max(6, l + (Math.random() - 0.5) * 4)));
      setFps((f) => Math.min(120, Math.max(58, f + (Math.random() - 0.4) * 10)));
    }, 1200);
    return () => clearInterval(iv);
  }, []);

  return { gpu: Math.round(gpu), latency: Math.round(latency), fps: Math.round(fps) };
}

function TelemetryPanel({ started = true }: { started?: boolean }) {
  const { gpu, latency, fps } = useTelemetry();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={started ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
      transition={{ type: "spring", stiffness: 350, damping: 35, delay: 1.0 }}
      className="absolute bottom-24 left-6 z-20 pointer-events-none"
      style={{ willChange: "transform, opacity", backfaceVisibility: "hidden" }}
    >
      <div className="relative bg-white border border-black/15 shadow-sm rounded-sm p-4 font-mono text-xs cyber-scanlines overflow-hidden">
        <span className="absolute -top-px -left-px w-3 h-3 border-t border-l border-[#FF4500]" />
        <span className="absolute -top-px -right-px w-3 h-3 border-t border-r border-[#FF4500]" />
        <span className="absolute -bottom-px -left-px w-3 h-3 border-b border-l border-[#FF4500]" />
        <span className="absolute -bottom-px -right-px w-3 h-3 border-b border-r border-[#FF4500]" />

        <div className="text-[#FF4500] tracking-widest mb-3 text-[10px]">
          SYS.TELEMETRY
        </div>

        <div className="space-y-2.5">
          <div>
            <div className="flex justify-between text-[#767E8C]">
              <span>GPU_MEM</span>
              <span className="text-[#FF4500]">{gpu}%</span>
            </div>
            <div className="mt-1 h-1 bg-black/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  width: `${gpu}%`,
                  background: "#FF4500",
                  willChange: "width",
                }}
                animate={{ width: `${gpu}%` }}
                transition={{ type: "spring", stiffness: 350, damping: 35 }}
              />
            </div>
          </div>

          <div className="flex justify-between">
            <span className="text-[#767E8C]">LATENCY</span>
            <span className="text-[#0E7A56]">{latency}ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#767E8C]">FPS</span>
            <span className="text-[#B45309]">{fps}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#767E8C]">MODEL</span>
            <span className="text-[#0E7A56]">● ACTIVE</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero text                                                          */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Hero text                                                          */
/* ------------------------------------------------------------------ */

const ROTATING_TRACKS = [
  { text: "Scalable Software", color: "#2249C7" },
  { text: "Intelligent AI Systems", color: "#FF4500" },
  { text: "Governed Data Pipelines", color: "#0E7A56" },
];

const STACK_GROUPS: { label: string; color: string; items: string[] }[] = [
  { label: "LANGUAGES & FRAMEWORKS", color: "#FF4500", items: ["Python", "C++", "SQL", "JavaScript", "React", "FastAPI"] },
  { label: "AI & COMPUTER VISION", color: "#2249C7", items: ["PyTorch", "OpenCV", "Scikit-Learn"] },
  { label: "DATA & CLOUD", color: "#0E7A56", items: ["BigQuery", "Airflow", "Docker", "Apache Spark"] },
];

function scrollToId(id: string) {
  document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
}

export function HeroText({ className = "", started = true }: { className?: string; started?: boolean }) {
  const [trackIdx, setTrackIdx] = useState(0);

  useEffect(() => {
    if (!started) return;
    const iv = setInterval(() => setTrackIdx((i) => (i + 1) % ROTATING_TRACKS.length), 2600);
    return () => clearInterval(iv);
  }, [started]);

  const track = ROTATING_TRACKS[trackIdx];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={started ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ type: "spring", stiffness: 350, damping: 35, delay: 0.15 }}
      className={`text-center px-4 ${className}`}
      style={{ willChange: "transform, opacity", backfaceVisibility: "hidden" }}
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={started ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
        transition={{ type: "spring", stiffness: 350, damping: 35, delay: 0.1 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 border border-[#FF4500]/30 bg-[#FF4500]/5 rounded-sm font-mono text-xs tracking-widest text-[#FF4500]"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#0E7A56] cyber-blink" />
        CS UNDERGRAD · NIT TRICHY · OPEN TO WORK
      </motion.div>

      {/* operator name — spring-staggered letter reveal + HUD underline */}
      <div className="mb-5">
        <motion.p
          initial={{ opacity: 0 }}
          animate={started ? { opacity: 1 } : { opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 35, delay: 0.25 }}
          className="font-mono text-[11px] md:text-xs tracking-[0.35em] uppercase text-[#767E8C]"
        >
          <span className="text-[#FF4500]">&gt;_</span> Hello, I&apos;m
        </motion.p>
        <div
          aria-label="Goparaju Goutham Sai"
          className="mt-2 font-mono font-bold tracking-tight leading-none text-3xl md:text-5xl lg:text-6xl"
        >
          {"GOPARAJU GOUTHAM SAI".split("").map((ch, i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              initial={{ opacity: 0, y: 14 }}
              animate={started ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
              transition={{ type: "spring", stiffness: 350, damping: 35, delay: 0.35 + i * 0.03 }}
              className={`inline-block ${i >= 9 ? "text-[#FF4500]" : "text-[#0B0F19]"}`}
              style={{ willChange: "transform, opacity", backfaceVisibility: "hidden" }}
            >
              {ch === " " ? "\u00A0" : ch}
            </motion.span>
          ))}
          <motion.span
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={started ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.35 + 20 * 0.03 }}
            className="inline-block w-[0.55em] h-[0.9em] ml-1.5 -mb-[0.08em] bg-[#FF4500] cyber-blink"
          />
        </div>
        <motion.div
          aria-hidden="true"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={started ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 35, delay: 1.1 }}
          className="mx-auto mt-3 h-[2px] w-32 origin-center bg-gradient-to-r from-transparent via-[#FF4500] to-transparent"
          style={{ willChange: "transform, opacity" }}
        />
      </div>

      {/* versatile headline + rotating track */}
      <h1 className="font-mono font-bold tracking-tight text-[#0B0F19] leading-[1.15]">
        <span className="sr-only">
          Engineering Scalable Software, Intelligent AI Systems and Governed Data Pipelines
        </span>
        <span aria-hidden="true" className="block text-2xl md:text-4xl lg:text-5xl">
          Engineering
        </span>
        <span
          aria-hidden="true"
          className="relative block h-[1.3em] text-xl md:text-3xl lg:text-4xl font-bold"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={trackIdx}
              initial={{ y: 22, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -22, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ color: track.color, willChange: "transform, opacity", backfaceVisibility: "hidden" }}
            >
              {track.text}
            </motion.span>
          </AnimatePresence>
        </span>
      </h1>

      {/* rotator position dots */}
      <div className="mt-3 flex items-center justify-center gap-2" aria-hidden="true">
        {ROTATING_TRACKS.map((t, i) => (
          <button
            key={t.text}
            tabIndex={-1}
            onClick={() => setTrackIdx(i)}
            className="h-1.5 rounded-full transition-all duration-300 cursor-pointer"
            style={{
              width: i === trackIdx ? 22 : 8,
              backgroundColor: i === trackIdx ? t.color : "rgba(11,15,25,0.15)",
              boxShadow: i === trackIdx ? `0 0 8px ${t.color}66` : "none",
            }}
          />
        ))}
      </div>

      <p className="mt-6 text-sm md:text-base text-[#4A5261] max-w-2xl mx-auto leading-relaxed">
        Computer Science Engineer experienced in building end-to-end web/mobile
        apps, real-time computer vision models, and production-grade data pipelines.
      </p>

      {/* dual CTA */}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => scrollToId("#work")}
          className="relative px-6 py-2.5 font-mono text-xs font-bold tracking-widest bg-[#FF4500] text-[#0B0F19] border border-[#0B0F19] rounded-sm shadow-[3px_3px_0_#0B0F19] hover:-translate-y-px hover:shadow-[4px_4px_0_#0B0F19] active:translate-y-0 active:shadow-[2px_2px_0_#0B0F19] transition-all cursor-pointer"
        >
          <span className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t border-l border-[#0B0F19]" />
          <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 border-b border-r border-[#0B0F19]" />
          [ VIEW PROJECTS → ]
        </button>
        <button
          type="button"
          onClick={() => scrollToId("#contact")}
          className="px-6 py-2.5 font-mono text-xs font-bold tracking-widest bg-white text-[#0B0F19] border border-black/15 rounded-sm hover:-translate-y-px hover:border-black/30 transition-all cursor-pointer"
        >
          [ CONTACT ME ]
        </button>
        <a
          href="/Goutham_Resume.pdf"
          download="Goutham_Resume.pdf"
          className="px-6 py-2.5 font-mono text-xs font-bold tracking-widest bg-white text-[#0E7A56] border border-[#0E7A56]/40 rounded-sm hover:-translate-y-px hover:border-[#0E7A56] transition-all cursor-pointer"
        >
          [ RESUME ↓ ]
        </a>
      </div>

      {/* categorized stack pills */}
      <div className="mt-10 mx-auto max-w-3xl grid sm:grid-cols-3 gap-3 text-left">
        {STACK_GROUPS.map((group, gi) => (
          <motion.div
            key={group.label}
            initial={{ opacity: 0, y: 16 }}
            animate={started ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 350, damping: 35, delay: 1.2 + gi * 0.12 }}
            className="relative bg-white/80 backdrop-blur-sm border border-black/15 rounded-sm p-3.5 shadow-sm"
            style={{ willChange: "transform, opacity", backfaceVisibility: "hidden" }}
          >
            <span
              className="absolute -top-px -left-px w-3 h-3 border-t border-l"
              style={{ borderColor: group.color }}
            />
            <div
              className="font-mono text-[10px] font-bold tracking-widest"
              style={{ color: group.color }}
            >
              {group.label}
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {group.items.map((item) => (
                <span
                  key={item}
                  className="px-2 py-1 font-mono text-[11px] rounded-sm border"
                  style={{
                    borderColor: `${group.color}40`,
                    color: group.color,
                    backgroundColor: `${group.color}0A`,
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */

export function Hero({ started = true }: { started?: boolean }) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div ref={ref} className="relative w-full min-h-screen overflow-hidden">
      {/* grid backdrop */}
      <div className="absolute inset-0 cyber-grid-bg opacity-30 pointer-events-none z-0" />

      <div className="absolute inset-0 z-0">
        {inView && (
          <Canvas
            camera={{ position: [0, 0, 6], fov: 50 }}
            style={{ width: "100%", height: "100%" }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
            }}
            dpr={[1, 2]}
            onCreated={({ gl }) => gl.setClearColor(0xF2F4F3, 0)}
          >
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 10, 7]} intensity={0.5} color="#FF4500" />
            <directionalLight position={[-5, 5, -5]} intensity={0.3} color="#2249C7" />

            <NeuralSynapse />
            <AmbientDust count={60} />
          </Canvas>
        )}
      </div>

      {/* corner HUD brackets */}
      <div className="absolute inset-4 md:inset-8 pointer-events-none z-10">
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#FF4500]/40" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#FF4500]/40" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#FF4500]/40" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#FF4500]/40" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center py-28">
        <HeroText started={started} />
      </div>

      <TelemetryPanel started={started} />

      <div className="absolute bottom-8 right-6 z-20 pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={started ? { opacity: 1 } : { opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 35, delay: 1.4 }}
          className="font-mono text-[10px] text-[#767E8C] tracking-widest text-right"
        >
          <div>CURSOR_TRACK: <span className="text-[#FF4500]">ACTIVE</span></div>
          <div>SESSION: <span className="text-[#2249C7]">ENCRYPTED</span></div>
        </motion.div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-10">
        <span className="font-mono text-[10px] text-[#767E8C] tracking-[0.3em] uppercase">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-[#FF4500] to-transparent" />
      </div>
    </div>
  );
}
