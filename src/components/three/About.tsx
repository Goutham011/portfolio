"use client";

import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { motion } from "framer-motion";
import { useInView } from "@/lib/hooks";
import { hash01 } from "@/lib/random";
import { getCircularParticleTexture } from "@/lib/particleTexture";

type Skill = { name: string; level: number; color: string; category: string };

const skills: Skill[] = [
  { name: "React Native", level: 84, color: "#FF4500", category: "Full-Stack" },
  { name: "JavaScript", level: 86, color: "#B45309", category: "Full-Stack" },
  { name: "Python", level: 92, color: "#0E7A56", category: "Language" },
  { name: "SQL", level: 90, color: "#2249C7", category: "Data" },
  { name: "PyTorch", level: 85, color: "#FF4500", category: "ML" },
  { name: "YOLOv3", level: 88, color: "#B45309", category: "Vision" },
  { name: "OpenCV", level: 87, color: "#0E7A56", category: "Vision" },
  { name: "Scikit-learn", level: 83, color: "#2249C7", category: "ML" },
  { name: "BigQuery", level: 86, color: "#FF4500", category: "Warehouse" },
  { name: "Airflow", level: 85, color: "#B45309", category: "Orchestration" },
  { name: "Docker", level: 81, color: "#0E7A56", category: "Cloud" },
  { name: "Apache Spark", level: 84, color: "#2249C7", category: "Big Data" },
];

function SkillOrbit({ skills: sk, radius = 3 }: { skills: Skill[]; radius?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
      groupRef.current.rotation.x = Math.sin(performance.now() * 0.0003) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {sk.map((skill, i) => (
        <SkillNode key={skill.name} skill={skill} index={i} total={sk.length} radius={radius}
          hovered={hoveredIndex === i} onHover={() => setHoveredIndex(i)} onLeave={() => setHoveredIndex(null)} />
      ))}
      <CorePulse radius={0.8} color="#FF4500" />
      <ConnectionLines skills={sk} radius={radius} />
    </group>
  );
}

function SkillNode({ skill, index, total, radius, hovered, onHover, onLeave }: {
  skill: Skill; index: number; total: number; radius: number; hovered: boolean; onHover: () => void; onLeave: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const scaleRef = useRef(1);
  const angle = (index / total) * Math.PI * 2;
  const yOffset = (index % 2 - 0.5) * 1.5;

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3;
      meshRef.current.rotation.x += delta * 0.2;
      const targetScale = hovered ? 1.3 : 1;
      scaleRef.current += (targetScale - scaleRef.current) * 0.1;
      meshRef.current.scale.setScalar(scaleRef.current);
    }
  });

  const geometry = useMemo(() => new THREE.OctahedronGeometry(0.3, 0), []);
  const material = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(skill.color), metalness: 0.3, roughness: 0.2, clearcoat: 1,
    envMapIntensity: 2, emissive: new THREE.Color(skill.color),
    emissiveIntensity: hovered ? 0.5 : 0.1,
  }), [skill.color, hovered]);

  const ringGeometry = useMemo(() => new THREE.RingGeometry(0.4, 0.45, 4), []);
  const ringMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(skill.color), side: THREE.DoubleSide, transparent: true,
    opacity: hovered ? 0.6 : 0.2, blending: THREE.NormalBlending,
  }), [skill.color, hovered]);

  const position = new THREE.Vector3(Math.cos(angle) * radius, yOffset + Math.sin(angle * 2) * 0.3, Math.sin(angle) * radius);

  return (
    <group position={position} onPointerOver={onHover} onPointerOut={onLeave}>
      <mesh geometry={ringGeometry} material={ringMaterial} scale={hovered ? 1.4 : 1} frustumCulled />
      <mesh ref={meshRef} geometry={geometry} material={material} frustumCulled />
    </group>
  );
}

function CorePulse({ radius, color }: { radius: number; color: string }) {
  const [pulse, setPulse] = useState(1);
  useFrame(() => { setPulse(1 + Math.sin(performance.now() * 0.002) * 0.15); });

  return (
    <group>
      {[1, 2, 3].map((i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} scale={pulse * i * 0.8}>
          <ringGeometry args={[radius * i * 0.4, radius * i * 0.42, 4]} />
          <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.1 / i} blending={THREE.NormalBlending} />
        </mesh>
      ))}
      <mesh scale={pulse}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshPhysicalMaterial color={color} metalness={0} roughness={0.1} transmission={0.9} thickness={1} ior={1.5} clearcoat={1} envMapIntensity={2} emissive={color} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function ConnectionLines({ skills: sk, radius }: { skills: Skill[]; radius: number }) {
  const lineRef = useRef<THREE.LineSegments>(null);
  useFrame((_, delta) => { if (lineRef.current) lineRef.current.rotation.y += delta * 0.05; });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    const center = new THREE.Vector3(0, 0, 0);
    const coreColor = new THREE.Color("#FF4500");

    sk.forEach((skill, i) => {
      const angle = (i / sk.length) * Math.PI * 2;
      const yOffset = (i % 2 - 0.5) * 1.5;
      const nodePos = new THREE.Vector3(Math.cos(angle) * radius, yOffset + Math.sin(angle * 2) * 0.3, Math.sin(angle) * radius);
      positions.push(center.x, center.y, center.z, nodePos.x, nodePos.y, nodePos.z);
      const color = new THREE.Color(skill.color);
      colors.push(coreColor.r, coreColor.g, coreColor.b, color.r, color.g, color.b);
    });

    sk.forEach((skill, i) => {
      const next = (i + 1) % sk.length;
      const angle1 = (i / sk.length) * Math.PI * 2;
      const angle2 = (next / sk.length) * Math.PI * 2;
      const yOffset1 = (i % 2 - 0.5) * 1.5;
      const yOffset2 = (next % 2 - 0.5) * 1.5;
      const pos1 = new THREE.Vector3(Math.cos(angle1) * radius, yOffset1 + Math.sin(angle1 * 2) * 0.3, Math.sin(angle1) * radius);
      const pos2 = new THREE.Vector3(Math.cos(angle2) * radius, yOffset2 + Math.sin(angle2 * 2) * 0.3, Math.sin(angle2) * radius);
      positions.push(pos1.x, pos1.y, pos1.z, pos2.x, pos2.y, pos2.z);
      const c1 = new THREE.Color(skill.color);
      const c2 = new THREE.Color(sk[next].color);
      colors.push(c1.r, c1.g, c1.b, c2.r, c2.g, c2.b);
    });

    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, [sk, radius]);

  const material = useMemo(() => new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.15, blending: THREE.NormalBlending, depthWrite: false,
  }), []);

  return <lineSegments ref={lineRef} geometry={geometry} material={material} frustumCulled />;
}

function SkillLabel({ skill, index, total, radius }: SkillLabelProps) {
  const angle = (index / total) * Math.PI * 2;
  const yOffset = (index % 2 - 0.5) * 1.5;
  const x = Math.cos(angle) * radius * 70;
  const y = -(yOffset + Math.sin(angle * 2) * 0.3) * 120 - 100;

  return (
    <motion.span
      style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`, transform: "translate(-50%, -50%)", willChange: "transform, opacity", backfaceVisibility: "hidden" }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 0.5, scale: 1 }}
      transition={{ type: "spring", stiffness: 350, damping: 35 }}
      className="absolute hidden md:block px-2.5 py-1 rounded-sm text-xs font-mono font-bold whitespace-nowrap text-[#0B0F19] pointer-events-none border border-black/15 bg-white shadow-sm"
    >
      {skill.name}
    </motion.span>
  );
}

interface SkillLabelProps { skill: Skill; index: number; total: number; radius: number; }

function SkillParticles({ count, spread }: { count: number; spread: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  useFrame((_, delta) => {
    if (pointsRef.current) { pointsRef.current.rotation.y += delta * 0.005; pointsRef.current.rotation.x += delta * 0.002; }
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = hash01(i * 5 + 1) * Math.PI * 2;
      const phi = Math.acos(2 * hash01(i * 5 + 2) - 1);
      const r = spread * (0.2 + hash01(i * 5 + 3) * 0.8);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) + (hash01(i * 5 + 4) - 0.5) * 2;
      positions[i * 3 + 2] = r * Math.cos(phi);
      const skill = skills[Math.floor(hash01(i * 5 + 5) * skills.length)];
      const color = new THREE.Color(skill.color);
      colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [count, spread]);

  const material = useMemo(() => new THREE.PointsMaterial({
    size: 1.0, map: getCircularParticleTexture(), transparent: true, opacity: 0.3,
    alphaTest: 0.01, vertexColors: true, sizeAttenuation: true,
    blending: THREE.NormalBlending, depthWrite: false,
  }), []);

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled />;
}

export function AboutSection() {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <section className="relative min-h-screen px-6 py-20 bg-gradient-to-b from-[#F2F4F3] via-[#FFFFFF] to-[#F2F4F3] overflow-hidden">
      <div className="absolute inset-0 cyber-grid-bg opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div ref={ref} className="relative h-[700px] lg:h-[800px] overflow-hidden">
            <div className="absolute inset-0 z-0">
              {inView && (
                <Canvas camera={{ position: [0, 0, 7], fov: 45 }} style={{ width: "100%", height: "100%" }}
                  gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
                  dpr={[1, 2]} onCreated={({ gl }) => gl.setClearColor(0xF2F4F3, 0)}>
                  <ambientLight intensity={0.4} />
                  <directionalLight position={[5, 10, 7]} intensity={0.5} color="#FF4500" />
                  <pointLight position={[0, 0, 5]} intensity={0.4} color="#2249C7" distance={20} decay={2} />
                  <SkillOrbit skills={skills} radius={3.5} />
                  <SkillParticles count={60} spread={6} />
                </Canvas>
              )}
            </div>
            <div className="absolute inset-0 pointer-events-none z-10">
              {skills.map((skill, i) => (
                <SkillLabel key={skill.name} skill={skill} index={i} total={skills.length} radius={3.5} />
              ))}
            </div>
          </div>

          <div className="pt-8 lg:pt-20">
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }} transition={{ type: "spring", stiffness: 350, damping: 35 }}>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-[#FF4500] tracking-widest">[03]</span>
                <span className="h-px flex-1 max-w-[60px] bg-[#FF4500]/30" />
                <span className="font-mono text-xs text-[#FF4500] tracking-widest uppercase">Operator Profile</span>
              </div>

              <h2 className="mt-4 font-mono text-3xl md:text-5xl font-bold tracking-tight leading-tight text-[#0B0F19]">
                Computer Science Engineer
                <br />
                <span className="text-2xl md:text-3xl font-light text-[#4A5261]">Software · Intelligence · Data</span>
              </h2>

              <div className="mt-8 space-y-5 text-[#4A5261] font-mono text-sm leading-relaxed">
                <p>I&apos;m a <span className="text-[#FF4500]">Computer Science &amp; Engineering undergraduate at NIT Trichy</span> building <span className="text-[#0B0F19]">robust software</span>, <span className="text-[#0B0F19]">intelligent ML models</span>, and <span className="text-[#0B0F19]">scalable data pipelines</span>.</p>
                <p>Full-stack (<span className="text-[#2249C7]">React Native, JavaScript</span>), vision &amp; ML (<span className="text-[#FF4500]">PyTorch, YOLOv3, OpenCV, Scikit-learn</span>), data infra (<span className="text-[#0E7A56]">SQL, BigQuery, Airflow, Docker</span>) — battle-tested on surgical VR interfaces, autonomous perception stacks, and ETL workflows.</p>
                <p>Beyond engineering, I&apos;ve <span className="text-[#B45309]">led campus-wide operations and publicity</span> — lead a team of 10, driving +40% turnout.</p>
              </div>

              <div className="mt-8 space-y-3">
                {[
                  { dot: "#FF4500", label: "EDUCATION", value: "B.Tech CSE · NIT Trichy" },
                  { dot: "#0E7A56", label: "LEADERSHIP", value: "Akshara & Vortex Manager · Lead team of 10" },
                  { dot: "#2249C7", label: "STANDING", value: "JEE Mains AIR 996 · Math Olympiad Rank 3" },
                ].map((cred, i) => (
                  <motion.div
                    key={cred.label}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 350, damping: 35, delay: 0.2 + i * 0.08 }}
                    className="flex items-center gap-4 p-3.5 bg-white border border-black/15 shadow-sm rounded-sm"
                    style={{ willChange: "transform, opacity", backfaceVisibility: "hidden" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cred.dot, boxShadow: `0 0 6px ${cred.dot}` }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[#767E8C] text-[10px] font-mono tracking-widest">{cred.label}</div>
                      <div className="text-[#0B0F19] text-sm font-mono truncate">{cred.value}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
