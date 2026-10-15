"use client";

import { useCallback, useEffect, useState } from "react";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from "framer-motion";

interface SectionDef {
  id: string;
  label: string;
  color: string;
}

const SECTIONS: SectionDef[] = [
  { id: "home", label: "01", color: "#FF4500" },
  { id: "work", label: "02", color: "#2249C7" },
  { id: "about", label: "03", color: "#0E7A56" },
  { id: "cnn", label: "04", color: "#FF4500" },
  { id: "terminal", label: "05", color: "#B45309" },
  { id: "cv", label: "06", color: "#0E7A56" },
  { id: "contact", label: "07", color: "#2249C7" },
];

const RAIN = [
  "01001 10110",
  "01101 10011",
  "01110 10101",
  "00110 11010",
  "01011 10110",
  "11001 00110",
  "10100 01011",
  "00101 11001",
].join("\n");

function TrackPulse({ i, sv }: { i: number; sv: MotionValue<number> }) {
  const phase = (v: number) => (v * 1.4 + i / 3) % 1;
  const y = useTransform(sv, (v) => `${phase(v) * 58}vh`);
  const opacity = useTransform(sv, (v) => Math.min(1, Math.sin(phase(v) * Math.PI) * 1.7));
  return (
    <motion.div
      className="absolute top-0 left-1/2 h-4 w-1 -translate-x-1/2 rounded-full pointer-events-none"
      style={{
        y,
        opacity,
        background: "linear-gradient(to bottom, #FF4500, transparent)",
        boxShadow: "0 0 8px rgba(255,69,0,0.35)",
        willChange: "transform, opacity",
      }}
    />
  );
}

function NodeDot({
  n,
  sv,
  active,
}: {
  n: SectionDef & { top: number };
  sv: MotionValue<number>;
  active: boolean;
}) {
  const color = useTransform(sv, (v) =>
    v * 100 >= n.top - 0.5 ? n.color : "rgba(11,15,25,0.2)"
  );
  const scale = useTransform(sv, (v) => (v * 100 >= n.top - 0.5 ? 1 : 0.7));
  return (
    <div
      className="absolute left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2"
      style={{ top: `${n.top}%` }}
    >
      <motion.span
        className="block h-2 w-2 rounded-full"
        style={{ backgroundColor: color, scale, willChange: "transform" }}
      />
      {active && (
        <>
          <span
            className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border cyber-pulse-ring pointer-events-none"
            style={{ borderColor: n.color }}
          />
          <span
            className="absolute left-4 -translate-y-1/2 font-mono text-[9px] tracking-widest whitespace-nowrap"
            style={{ color: n.color }}
          >
            {n.label}
          </span>
        </>
      )}
    </div>
  );
}

export function BackboneThread() {
  const { scrollY, scrollYProgress } = useScroll();
  const [nodes, setNodes] = useState<(SectionDef & { top: number })[]>([]);
  const [activeId, setActiveId] = useState("home");

  const updateActive = useCallback((v: number) => {
    let cur = SECTIONS[0].id;
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el && v >= el.offsetTop - window.innerHeight * 0.45) cur = s.id;
    }
    setActiveId(cur);
  }, []);

  useEffect(() => {
    const measure = () => {
      const max = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      setNodes(
        SECTIONS.map((s) => {
          const el = document.getElementById(s.id);
          const top = el ? Math.min((el.offsetTop / max) * 100, 100) : 0;
          return { ...s, top };
        })
      );
    };
    measure();
    const t1 = setTimeout(measure, 1200);
    const t2 = setTimeout(measure, 3200);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => updateActive(window.scrollY));
    return () => cancelAnimationFrame(raf);
  }, [updateActive]);

  useMotionValueEvent(scrollY, "change", updateActive);

  return (
    <div
      className="pointer-events-none fixed right-5 top-1/2 z-30 hidden h-[58vh] w-6 -translate-y-1/2 lg:block"
      aria-hidden="true"
    >
      {/* vertical data-stream rain */}
      <div className="absolute inset-0 overflow-hidden opacity-40">
        <div className="stream-rain whitespace-pre text-center font-mono text-[7px] leading-[9px] text-[#FF4500]/50">
          {RAIN}
          {"\n"}
          {RAIN}
        </div>
      </div>

      {/* track + progress fill */}
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-black/10" />
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2">
        <motion.div
          className="h-full w-full"
          style={{
            scaleY: scrollYProgress,
            transformOrigin: "top",
            background: "#FF4500",
            willChange: "transform",
          }}
        />
      </div>

      {/* traveling pulses */}
      <TrackPulse i={0} sv={scrollYProgress} />
      <TrackPulse i={1} sv={scrollYProgress} />
      <TrackPulse i={2} sv={scrollYProgress} />

      {/* section nodes */}
      {nodes.map((n) => (
        <NodeDot key={n.id} n={n} sv={scrollYProgress} active={n.id === activeId} />
      ))}
    </div>
  );
}
