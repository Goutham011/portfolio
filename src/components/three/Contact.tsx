"use client";

import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "@/lib/hooks";
import { hash01 } from "@/lib/random";
import { getCircularParticleTexture } from "@/lib/particleTexture";

const DECO_POSITIONS: [number, number, number][] = [
  [-2.5, 2.5, 0.5],
  [2.5, -2.5, 0.5],
  [-2.5, -2.5, 0.5],
  [2.5, 2.5, 0.5],
];

export function ContactSection() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  const validate = (field: string, value: string) => {
    if (field === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return true;
    if (field === "name" && value.length > 0 && value.length < 2) return true;
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, boolean> = {};
    if (!formData.name) errs.name = true;
    if (!formData.email || validate("email", formData.email)) errs.email = true;
    if (!formData.message) errs.message = true;
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setStatus("sending");
    await new Promise(r => setTimeout(r, 1500));
    setStatus("success");
    setFormData({ name: "", email: "", message: "" });
    setTimeout(() => setStatus("idle"), 3000);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: validate(field, value) }));
    }
  };

  return (
    <section className="relative min-h-screen px-6 py-20 bg-gradient-to-b from-[#F2F4F3] via-[#FFFFFF] to-[#F2F4F3] overflow-hidden">
      <div className="absolute inset-0 cyber-grid-bg opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="pt-8 lg:pt-20">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }} transition={{ type: "spring", stiffness: 350, damping: 35 }}>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-[#FF4500] tracking-widest">[07]</span>
                <span className="h-px flex-1 max-w-[60px] bg-[#FF4500]/30" />
                <span className="font-mono text-xs text-[#FF4500] tracking-widest uppercase">Neural Link</span>
              </div>

              <h2 className="mt-4 font-mono text-3xl md:text-5xl font-bold tracking-tight leading-tight text-[#0B0F19]">
                Initiate <span className="text-[#2249C7]">Neural</span>
                <br />
                <span className="text-2xl md:text-3xl font-light text-[#4A5261]">Link Protocol</span>
              </h2>

              <p className="mt-6 font-mono text-sm text-[#4A5261] leading-relaxed max-w-lg">
                Encrypted channel open. Transmit collaboration requests, research inquiries, or deployment proposals. Response latency typically &lt; 24h.
              </p>

              <div className="mt-10 space-y-3">
                {[
                  { label: "EMAIL", value: "gouthamsaigoparaju@gmail.com", href: "mailto:gouthamsaigoparaju@gmail.com", color: "#FF4500" },
                  { label: "PHONE", value: "+91-9010223834", href: "tel:+919010223834", color: "#2249C7" },
                  { label: "GITHUB", value: "github.com/Goutham011", href: "https://github.com/Goutham011", color: "#0E7A56" },
                  { label: "LINKEDIN", value: "linkedin.com/in/GouthamSai", href: "https://linkedin.com/in/GouthamSai", color: "#B45309" },
                ].map((contact, i) => (
                  <motion.a key={contact.label} href={contact.href} target="_blank" rel="noopener noreferrer"
                    initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 350, damping: 35, delay: 0.2 + i * 0.08 }}
                    className="flex items-center gap-4 p-3.5 bg-white border border-black/15 shadow-sm rounded-sm hover:border-black/25 transition-all group"
                    style={{ willChange: "transform, opacity", backfaceVisibility: "hidden" }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: contact.color, boxShadow: `0 0 6px ${contact.color}` }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[#767E8C] text-[10px] font-mono tracking-widest">{contact.label}</div>
                      <div className="text-[#0B0F19] text-sm font-mono group-hover:text-[color:var(--c)] transition-colors" style={{ ["--c" as string]: contact.color }}>
                        {contact.value}
                      </div>
                    </div>
                    <span className="text-[#767E8C] group-hover:text-[#FF4500] transition-colors text-xs font-mono">→</span>
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>

          <div ref={ref} className="relative">
            <div className="absolute inset-0 z-0">
              {inView && (
                <Canvas camera={{ position: [0, 0, 6], fov: 40 }} style={{ width: "100%", height: "100%" }}
                  gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
                  dpr={[1, 2]} onCreated={({ gl }) => gl.setClearColor(0xF2F4F3, 0)}>
                  <ambientLight intensity={0.5} />
                  <directionalLight position={[5, 10, 7]} intensity={0.4} color="#FF4500" />
                  <pointLight position={[-3, 2, 4]} intensity={0.4} color="#2249C7" distance={15} decay={2} />
                  <FloatingDeco position={DECO_POSITIONS[0]} color={0xFF4500} speed={0.5} />
                  <FloatingDeco position={DECO_POSITIONS[1]} color={0x2249C7} speed={0.7} />
                  <FloatingDeco position={DECO_POSITIONS[2]} color={0x0E7A56} speed={0.4} />
                  <FloatingDeco position={DECO_POSITIONS[3]} color={0xB45309} speed={0.6} />
                  <ContactParticles count={50} spread={5} />
                </Canvas>
              )}
            </div>

            <div className="relative z-10 flex items-center justify-center py-8">
              <form onSubmit={handleSubmit} className="relative w-full max-w-[440px] p-7 space-y-5 bg-white border border-black/15 shadow-sm rounded-sm cyber-scanlines overflow-hidden">
                <span className="absolute -top-px -left-px w-4 h-4 border-t border-l border-[#FF4500]" />
                <span className="absolute -top-px -right-px w-4 h-4 border-t border-r border-[#FF4500]" />
                <span className="absolute -bottom-px -left-px w-4 h-4 border-b border-l border-[#FF4500]" />
                <span className="absolute -bottom-px -right-px w-4 h-4 border-b border-r border-[#FF4500]" />

                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#FF4500] tracking-widest">DISPATCH_TERMINAL</span>
                  <span className="flex items-center gap-1.5 font-mono text-[10px] text-[#0E7A56]">
                    <span className="w-1 h-1 rounded-full bg-[#0E7A56] cyber-blink" /> ENCRYPTED
                  </span>
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-[#FF4500] mb-1.5 tracking-widest">
                    &gt; IDENTIFIER
                  </label>
                  <input type="text" value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className={`w-full px-3 py-2.5 bg-white border rounded-sm text-[#0B0F19] text-sm font-mono placeholder-[#767E8C] focus:shadow-[0_0_0_3px_rgba(255,69,0,0.2)] transition-colors ${fieldErrors.name ? "border-red-500/60" : "border-black/15 focus:border-[#FF4500]/60"}`}
                    placeholder="your_name" />
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-[#FF4500] mb-1.5 tracking-widest">
                    &gt; EMAIL_ADDR
                  </label>
                  <input type="email" value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className={`w-full px-3 py-2.5 bg-white border rounded-sm text-[#0B0F19] text-sm font-mono placeholder-[#767E8C] focus:shadow-[0_0_0_3px_rgba(255,69,0,0.2)] transition-colors ${fieldErrors.email ? "border-red-500/60" : "border-black/15 focus:border-[#FF4500]/60"}`}
                    placeholder="user@domain.com" />
                  {fieldErrors.email && (
                    <span className="text-red-400 text-[10px] font-mono mt-1 block">ERR: invalid email format</span>
                  )}
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-[#FF4500] mb-1.5 tracking-widest">
                    &gt; PAYLOAD
                  </label>
                  <textarea value={formData.message} rows={4}
                    onChange={(e) => handleChange("message", e.target.value)}
                    className={`w-full px-3 py-2.5 bg-white border rounded-sm text-[#0B0F19] text-sm font-mono placeholder-[#767E8C] focus:shadow-[0_0_0_3px_rgba(255,69,0,0.2)] resize-none transition-colors ${fieldErrors.message ? "border-red-500/60" : "border-black/15 focus:border-[#FF4500]/60"}`}
                    placeholder="Describe your neural link request..." />
                </div>

                <button type="submit" disabled={status === "sending"}
                  className="relative w-full py-3 font-mono text-sm font-bold tracking-widest transition-all flex items-center justify-center gap-2 bg-[#FF4500] text-[#0B0F19] border border-[#0B0F19] rounded-sm hover:-translate-y-px hover:shadow-[4px_4px_0_#0B0F19] disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer">
                  <span className="absolute -top-0.5 -left-0.5 w-2 h-2 border-t border-l border-[#FF4500]" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b border-r border-[#FF4500]" />
                  <AnimatePresence mode="wait">
                    {status === "sending" && (
                      <motion.span key="sending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        TRANSMITTING...
                      </motion.span>
                    )}
                    {status === "success" && (
                      <motion.span key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="text-[#0E7A56]">✓ LINK ESTABLISHED</motion.span>
                    )}
                    {(status === "idle" || status === "error") && (
                      <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        SEND_TRANSMISSION →
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>

                {status === "error" && (
                  <p className="text-red-400 text-xs font-mono text-center">ERR: transmission failed — retry</p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FloatingDeco({ position, color, speed }: { position: [number, number, number]; color: number; speed: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * speed;
      meshRef.current.rotation.y += delta * speed * 1.3;
      meshRef.current.position.y = position[1] + Math.sin(performance.now() * 0.001 * speed * 2) * 0.15;
    }
  });

  const geometry = useMemo(() => {
    const geometries = [
      new THREE.TetrahedronGeometry(0.4, 0),
      new THREE.OctahedronGeometry(0.35, 0),
      new THREE.OctahedronGeometry(0.3, 0),
    ];
    return geometries[Math.floor(hash01(position[0] + position[1]) * geometries.length)];
  }, [position]);

  return (
    <mesh ref={meshRef} position={position} geometry={geometry}>
      <meshPhysicalMaterial color={color} metalness={0.3} roughness={0.2} clearcoat={1} envMapIntensity={2}
        emissive={color} emissiveIntensity={0.15} />
    </mesh>
  );
}

function ContactParticles({ count, spread }: { count: number; spread: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.003;
      pointsRef.current.rotation.x += delta * 0.001;
    }
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [0xFF4500, 0x2249C7, 0x0E7A56, 0xB45309];
    for (let i = 0; i < count; i++) {
      const theta = hash01(i * 3 + 1) * Math.PI * 2;
      const phi = Math.acos(2 * hash01(i * 3 + 2) - 1);
      const r = spread * (0.3 + hash01(i * 3 + 3) * 0.7);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      const color = new THREE.Color(palette[Math.floor(hash01(i * 7 + 5) * palette.length)]);
      colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [count, spread]);

  const material = useMemo(() => new THREE.PointsMaterial({
    size: 1.0, map: getCircularParticleTexture(), transparent: true, opacity: 0.25,
    alphaTest: 0.01, vertexColors: true, sizeAttenuation: true,
    blending: THREE.NormalBlending, depthWrite: false,
  }), []);

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled />;
}
