"use client";

import { useState, useEffect, useMemo, useRef, useCallback, useImperativeHandle } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "@/lib/hooks";
import { hash01 } from "@/lib/random";

/* ------------------------------------------------------------------ */
/*  Simulation model (owned by the 3D loop — React only mirrors HUD)    */
/* ------------------------------------------------------------------ */

type Kind = "clean" | "null" | "dupe" | "outlier";

interface Packet {
  id: number;
  x: number;
  lane: number;
  speed: number;
  kind: Kind;
  state: "flow" | "quar" | "done";
  q: number;
  cx: number;
  cy: number;
  seed: number;
}

interface Sim {
  packets: Packet[];
  queue: Kind[];
  passed: number;
  quarantined: number;
  loaded: number;
  loadTimes: number[];
  nextId: number;
  gateFlash: number;
  loadFlash: number;
}

interface SimApi {
  inject: (kind: Kind, n: number) => void;
  reset: () => void;
  snapshot: () => { tps: number; rate: number; quar: number; loaded: number; active: number };
}

interface Hud {
  tps: number;
  rate: number;
  quar: number;
  loaded: number;
}

interface LogLine {
  id: number;
  text: string;
  color: string;
}

const KIND_COLOR: Record<Kind, string> = {
  clean: "#0E7A56",
  null: "#B45309",
  dupe: "#FF4500",
  outlier: "#2249C7",
};

const KIND_LABEL: Record<Kind, string> = {
  clean: "clean",
  null: "null-field",
  dupe: "duplicate",
  outlier: "outlier",
};

const STAGES = [
  { id: "source", label: "SOURCE", sub: "raw events", color: "#767E8C" },
  { id: "extract", label: "EXTRACT", sub: "ingest", color: "#FF4500" },
  { id: "kafka", label: "KAFKA", sub: "stream buffer", color: "#2249C7" },
  { id: "spark", label: "SPARK", sub: "transform", color: "#B45309" },
  { id: "airflow", label: "AIRFLOW", sub: "quality gate", color: "#FF4500" },
  { id: "bigquery", label: "BIGQUERY", sub: "warehouse", color: "#0E7A56" },
];

const STAGE_X = (i: number) => (i - 2.5) * 2.5;
const STAGE_Y = 0.6;
const GATE_X = STAGE_X(4);
const END_X = STAGE_X(5);
const BIN = { x: GATE_X, y: -1.7 };
const MAX_PACKETS = 56;

function createSim(): Sim {
  return {
    packets: [],
    queue: [],
    passed: 0,
    quarantined: 0,
    loaded: 0,
    loadTimes: [],
    nextId: 1,
    gateFlash: 0,
    loadFlash: 0,
  };
}

function makePacket(sim: Sim, kind: Kind): Packet | null {
  if (sim.packets.length >= MAX_PACKETS) return null;
  const id = sim.nextId++;
  return {
    id,
    x: STAGE_X(0) - 0.6 - hash01(id * 3 + 1) * 0.8,
    lane: (id % 3) - 1,
    speed: 1.5 + hash01(id * 7 + 2) * 0.9,
    kind,
    state: "flow",
    q: 0,
    cx: 0,
    cy: 0,
    seed: hash01(id * 13 + 3) * Math.PI * 2,
  };
}

/* ------------------------------------------------------------------ */
/*  3D scene                                                           */
/* ------------------------------------------------------------------ */

function StageNodes() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const g = groupRef.current;
    if (!g) return;
    g.children.forEach((node, i) => {
      node.rotation.y = t * (0.25 + (i % 3) * 0.12);
      const s = 1 + Math.sin(t * 2 + i * 1.3) * 0.08;
      node.scale.setScalar(s);
    });
  });

  return (
    <group ref={groupRef}>
      {STAGES.map((s, i) => (
        <group key={s.id} position={[STAGE_X(i), STAGE_Y, 0]}>
          <mesh frustumCulled>
            <boxGeometry args={[1.05, 1.05, 1.05]} />
            <meshBasicMaterial color={s.color} wireframe transparent opacity={0.45} />
          </mesh>
          <mesh frustumCulled>
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshBasicMaterial color={s.color} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* pipe */}
      <mesh position={[0, STAGE_Y, -0.18]} frustumCulled>
        <boxGeometry args={[15.5, 0.06, 0.06]} />
        <meshBasicMaterial color={0x0b0f19} transparent opacity={0.22} />
      </mesh>
      {/* quarantine bin */}
      <group position={[BIN.x, BIN.y, 0]}>
        <mesh frustumCulled>
          <boxGeometry args={[1.5, 0.9, 1.1]} />
          <meshBasicMaterial color={0xb45309} wireframe transparent opacity={0.6} />
        </mesh>
        <mesh position={[0, -0.45, 0]} frustumCulled>
          <boxGeometry args={[1.5, 0.06, 1.1]} />
          <meshBasicMaterial color={0xb45309} transparent opacity={0.5} />
        </mesh>
      </group>
    </group>
  );
}

function Packets({
  apiRef,
  running,
  onEvent,
}: {
  apiRef: React.RefObject<SimApi | null>;
  running: boolean;
  onEvent: (text: string, color: string) => void;
}) {
  const simRef = useRef<Sim>(createSim());
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const gateFlashRef = useRef<THREE.MeshBasicMaterial>(null);
  const loadFlashRef = useRef<THREE.MeshBasicMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useImperativeHandle(
    apiRef,
    () => ({
      inject(kind: Kind, n: number) {
        const sim = simRef.current;
        for (let i = 0; i < n; i++) sim.queue.push(kind);
      },
      reset() {
        simRef.current = createSim();
      },
      snapshot() {
        const sim = simRef.current;
        const now = performance.now();
        sim.loadTimes = sim.loadTimes.filter((ts) => now - ts < 2000);
        const judged = sim.passed + sim.quarantined;
        return {
          tps: sim.loadTimes.length / 2,
          rate: judged === 0 ? 100 : (sim.passed / judged) * 100,
          quar: sim.quarantined,
          loaded: sim.loaded,
          active: sim.packets.length,
        };
      },
    }),
    []
  );

  // Intentional mutable 60fps sim owned by this component (standard R3F pattern).
  // React state only mirrors via throttled snapshot — immutable per-frame
  // updates would cause re-render storms and kill performance.
  /* eslint-disable react-hooks/immutability */
  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const sim = simRef.current;
    const d = Math.min(delta, 0.05);
    const t = state.clock.getElapsedTime();

    if (running) {
      // drain spawn queue
      while (sim.queue.length > 0) {
        const p = makePacket(sim, sim.queue.shift()!);
        if (!p) break;
        sim.packets.push(p);
      }
      // advance packets
      for (const p of sim.packets) {
        if (p.state === "flow") {
          p.x += p.speed * d;
          if (p.x >= GATE_X) {
            if (p.kind === "clean") {
              sim.passed++;
            } else {
              p.state = "quar";
              p.q = 0;
              p.cx = p.x;
              p.cy = STAGE_Y + p.lane * 0.5;
              sim.quarantined++;
              sim.gateFlash = 1;
              onEvent(
                `[GATE] ${KIND_LABEL[p.kind]} record quarantined → bin #${sim.quarantined}`,
                "#B45309"
              );
            }
          } else if (p.x >= END_X - 0.15) {
            p.state = "done";
            sim.loaded++;
            sim.loadTimes.push(performance.now());
            sim.loadFlash = 1;
            if (sim.loaded % 25 === 0) {
              onEvent(`[LOAD] ${sim.loaded} records warehoused :: BigQuery`, "#0E7A56");
            }
          }
        } else if (p.state === "quar") {
          p.q = Math.min(1, p.q + d * 1.7);
          if (p.q >= 1) p.state = "done";
        }
      }
      sim.packets = sim.packets.filter((p) => p.state !== "done");
      // decay flashes
      sim.gateFlash = Math.max(0, sim.gateFlash - d * 2.4);
      sim.loadFlash = Math.max(0, sim.loadFlash - d * 2.4);
    }

    // render instances
    let n = 0;
    for (const p of sim.packets) {
      let x = p.x;
      let y = STAGE_Y + p.lane * 0.5 + Math.sin(t * 3 + p.seed) * 0.07;
      let s = 1;
      if (p.state === "quar") {
        const q = p.q;
        x = p.cx + (BIN.x - p.cx) * q;
        y = p.cy + (BIN.y - p.cy) * q - Math.sin(q * Math.PI) * 0.35;
        s = 1 - q * 0.85;
      }
      dummy.position.set(x, y, 0);
      dummy.scale.setScalar(0.22 * s);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(n, dummy.matrix);
      mesh.setColorAt(n, color.set(KIND_COLOR[p.kind]));
      n++;
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    if (gateFlashRef.current) gateFlashRef.current.opacity = sim.gateFlash * 0.55;
    if (loadFlashRef.current) loadFlashRef.current.opacity = sim.loadFlash * 0.5;
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PACKETS]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      {/* gate scanner flash */}
      <mesh position={[GATE_X, STAGE_Y, 0.1]}>
        <planeGeometry args={[0.14, 2.3]} />
        <meshBasicMaterial ref={gateFlashRef} color={0xff4500} transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* warehouse absorb flash */}
      <mesh position={[END_X, STAGE_Y, 0.1]}>
        <planeGeometry args={[1.3, 1.3]} />
        <meshBasicMaterial ref={loadFlashRef} color={0x0e7a56} transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function PipelineScene({
  apiRef,
  running,
  onEvent,
}: {
  apiRef: React.RefObject<SimApi | null>;
  running: boolean;
  onEvent: (text: string, color: string) => void;
}) {
  return (
    <>
      <StageNodes />
      <Packets apiRef={apiRef} running={running} onEvent={onEvent} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Section                                                            */
/* ------------------------------------------------------------------ */

const BOOT_LINES: LogLine[] = [
  { id: -2, text: "[BOOT] pipeline_sim v1.0 :: 6 stages online", color: "#767E8C" },
  { id: -1, text: "[FLOW] auto-trickle engaged :: clean batches inbound", color: "#0E7A56" },
];

export function PipelineSimulator() {
  const { ref, inView } = useInView<HTMLElement>();
  const [running, setRunning] = useState(true);
  const [hud, setHud] = useState<Hud>({ tps: 0, rate: 100, quar: 0, loaded: 0 });
  const [log, setLog] = useState<LogLine[]>(BOOT_LINES);
  const logId = useRef(0);
  const apiRef = useRef<SimApi | null>(null);

  const pushLog = useCallback((text: string, color: string) => {
    const id = logId.current++;
    setLog((prev) => [...prev.slice(-23), { id, text, color }]);
  }, []);

  /* spawner: auto-trickle of clean batches */
  useEffect(() => {
    if (!inView || !running) return;
    const iv = setInterval(() => {
      const snap = apiRef.current?.snapshot();
      if (!snap || snap.active > MAX_PACKETS - 10) return;
      if (Math.random() < 0.75) apiRef.current?.inject("clean", 1);
    }, 320);
    return () => clearInterval(iv);
  }, [inView, running]);

  /* HUD mirror (throttled — keeps per-frame sim out of React) */
  useEffect(() => {
    if (!inView) return;
    const iv = setInterval(() => {
      const snap = apiRef.current?.snapshot();
      if (!snap) return;
      setHud({ tps: snap.tps, rate: snap.rate, quar: snap.quar, loaded: snap.loaded });
    }, 300);
    return () => clearInterval(iv);
  }, [inView]);

  const inject = (kind: Kind, n: number) => {
    apiRef.current?.inject(kind, n);
    if (!running) setRunning(true);
    pushLog(`[INJECT] ${n}x ${KIND_LABEL[kind]} batch released → SOURCE`, KIND_COLOR[kind]);
  };

  const reset = () => {
    apiRef.current?.reset();
    setHud({ tps: 0, rate: 100, quar: 0, loaded: 0 });
    setLog(BOOT_LINES);
  };

  const metrics = [
    { label: "THROUGHPUT", value: `${hud.tps.toFixed(1)}/s`, color: "#FF4500" },
    { label: "CLEAN RATE", value: `${hud.rate.toFixed(1)}%`, color: "#0E7A56" },
    { label: "QUARANTINED", value: String(hud.quar), color: "#B45309" },
    { label: "WAREHOUSED", value: String(hud.loaded), color: "#2249C7" },
  ];

  const injectors: { label: string; kind: Kind; n: number }[] = [
    { label: "+ CLEAN BATCH", kind: "clean", n: 8 },
    { label: "+ NULL STORM", kind: "null", n: 10 },
    { label: "+ DUPLICATE FLOOD", kind: "dupe", n: 10 },
    { label: "+ OUTLIER SPIKE", kind: "outlier", n: 10 },
  ];

  return (
    <section ref={ref} className="relative min-h-screen px-6 py-20 bg-[#F2F4F3] overflow-hidden">
      <div className="absolute inset-0 cyber-grid-bg opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ type: "spring", stiffness: 350, damping: 35 }}
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[#FF4500] tracking-widest">[04]</span>
            <span className="h-px flex-1 max-w-[60px] bg-[#FF4500]/30" />
            <span className="font-mono text-xs text-[#FF4500] tracking-widest uppercase">
              Data Pipelines
            </span>
          </div>
          <h2 className="mt-4 font-mono text-3xl md:text-5xl font-bold tracking-tight text-[#0B0F19]">
            Pipeline <span className="text-[#0E7A56]">Simulator</span>
          </h2>
          <p className="mt-4 text-[#4A5261] max-w-2xl font-mono text-sm">
            A living ETL: packets stream from source to warehouse through Kafka,
            Spark and Airflow gates. Inject dirty data and watch quality checks
            quarantine it — simulated live in your browser.
          </p>
        </motion.div>

        {/* HUD metrics */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 350, damping: 35, delay: 0.2 + i * 0.08 }}
              className="relative p-4 bg-white border border-black/15 shadow-sm rounded-sm"
              style={{ willChange: "transform, opacity", backfaceVisibility: "hidden" }}
            >
              <span
                className="absolute -top-px -left-px w-2.5 h-2.5 border-t border-l"
                style={{ borderColor: m.color }}
              />
              <span
                className="absolute -bottom-px -right-px w-2.5 h-2.5 border-b border-r"
                style={{ borderColor: m.color }}
              />
              <div
                className="text-2xl font-mono font-bold tabular-nums"
                style={{ color: m.color, textShadow: `0 0 16px ${m.color}55` }}
              >
                {m.value}
              </div>
              <div className="text-[#767E8C] text-[10px] font-mono mt-1 tracking-wider uppercase">
                {m.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* 3D viewport */}
        <div className="mt-6 relative h-[360px] md:h-[440px] border border-black/15 bg-white shadow-sm overflow-hidden cyber-scanlines">
          <span className="absolute -top-px -left-px z-10 w-5 h-5 border-t border-l border-[#FF4500]/40" />
          <span className="absolute -top-px -right-px z-10 w-5 h-5 border-t border-r border-[#FF4500]/40" />
          <span className="absolute -bottom-px -left-px z-10 w-5 h-5 border-b border-l border-[#FF4500]/40" />
          <span className="absolute -bottom-px -right-px z-10 w-5 h-5 border-b border-r border-[#FF4500]/40" />

          <div className="absolute top-3 left-4 z-10 flex items-center gap-2 pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0E7A56] cyber-blink" />
            <span className="font-mono text-[10px] text-[#767E8C] tracking-widest">
              LIVE_ETL · INJECT DIRTY DATA TO TEST THE GATES
            </span>
          </div>

          <div className="absolute top-3 right-4 z-10 hidden sm:flex items-center gap-3 pointer-events-none">
            {(
              [
                ["CLEAN", "#0E7A56"],
                ["NULL", "#B45309"],
                ["DUPE", "#FF4500"],
                ["OUTLIER", "#2249C7"],
              ] as [string, string][]
            ).map(([n, c]) => (
              <span key={n} className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest text-[#767E8C]">
                <span className="w-1.5 h-1.5" style={{ backgroundColor: c }} />
                {n}
              </span>
            ))}
          </div>

          {inView && (
            <Canvas
              camera={{ position: [0, 0, 9], fov: 42 }}
              style={{ width: "100%", height: "100%" }}
              gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
              dpr={[1, 2]}
              onCreated={({ gl }) => gl.setClearColor(0xf2f4f3, 0)}
            >
              <PipelineScene apiRef={apiRef} running={running} onEvent={pushLog} />
            </Canvas>
          )}

          {/* stage labels */}
          <div className="absolute bottom-3 inset-x-4 z-10 grid grid-cols-6 pointer-events-none">
            {STAGES.map((s) => (
              <div key={s.id} className="text-center">
                <div className="font-mono text-[9px] md:text-[10px] font-bold tracking-widest truncate" style={{ color: s.color }}>
                  {s.label}
                </div>
                <div className="font-mono text-[8px] text-[#767E8C] tracking-wider truncate hidden md:block">
                  {s.sub}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* inject controls */}
        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          {injectors.map((b) => (
            <button
              key={b.label}
              type="button"
              onClick={() => inject(b.kind, b.n)}
              className="px-4 py-2 font-mono text-[11px] font-bold tracking-widest bg-white border rounded-sm shadow-sm hover:-translate-y-px transition-all cursor-pointer"
              style={{
                borderColor: `${KIND_COLOR[b.kind]}55`,
                color: KIND_COLOR[b.kind],
                backgroundColor: `${KIND_COLOR[b.kind]}0A`,
              }}
            >
              [ {b.label} ]
            </button>
          ))}
          <span className="hidden sm:inline-block w-px h-6 bg-black/15 mx-1" />
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className="px-4 py-2 font-mono text-[11px] font-bold tracking-widest border rounded-sm transition-all cursor-pointer"
            style={{
              color: running ? "#FF4500" : "#767E8C",
              borderColor: running ? "rgba(255,69,0,0.45)" : "rgba(11,15,25,0.15)",
              backgroundColor: running ? "rgba(255,69,0,0.06)" : "#FFFFFF",
            }}
          >
            {running ? "[ ⏸ PAUSE ]" : "[ ▶ RESUME ]"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 font-mono text-[11px] font-bold tracking-widest bg-white text-[#4A5261] border border-black/15 rounded-sm hover:text-[#0B0F19] hover:border-black/30 transition-all cursor-pointer"
          >
            [ RESET ]
          </button>
        </div>

        {/* gate event log */}
        <div className="mt-6 relative bg-white border border-black/15 shadow-sm rounded-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-black/10">
            <span className="w-1.5 h-1.5 bg-[#FF4500]" />
            <span className="font-mono text-[10px] font-bold tracking-widest text-[#0B0F19]">
              GATE_LOG
            </span>
            <span className="ml-auto font-mono text-[10px] text-[#767E8C] tracking-widest">
              AIRFLOW_DECISIONS :: LIVE
            </span>
          </div>
          <div className="px-4 py-3 min-h-[148px] flex flex-col justify-end gap-1">
            <AnimatePresence initial={false}>
              {log.slice(-6).map((l) => (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 350, damping: 35 }}
                  className="font-mono text-[11px] truncate"
                  style={{ color: l.color }}
                >
                  {l.text}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
