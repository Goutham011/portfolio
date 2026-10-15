"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useInView } from "@/lib/hooks";
import { ResumeShockwave } from "@/components/three/ResumeShockwave";
import { resumeData } from "@/lib/resumeData";

type Phase = "idle" | "fly" | "inject" | "boom" | "ready";

/* Uploaded resume served from /public — download target only, animations untouched */
const RESUME_PDF_URL = "/Goutham_Resume.pdf";
const RESUME_FILENAME = "Goutham_Resume.pdf";

const INJECT_MS = 3600;

const LOG_SCRIPT: { at: number; text: string }[] = [
  { at: 0, text: "[BOOT] resume_compiler v2.4.1 :: blueprint kernel" },
  { at: 320, text: "[PARSE] resume.json -> ast ok (6 sections)" },
  { at: 780, text: "[COMPILING] Aggregating ML engineering stats..." },
  { at: 1300, text: "[INJECT] Skills & Projects loaded" },
  { at: 1800, text: "[GLSL] rasterizing header block ..." },
  { at: 2350, text: "[RENDER] typesetting blueprint grid @ 1x" },
  { at: 2900, text: "[EMIT] xref table + trailer checksum" },
  { at: 3350, text: "[OK] resume.pdf ready :: 8.1 KB" },
];

const TERM_A = [
  "$ resume --compile --target=pdf",
  "  assets .......... 6 ok",
  "  fonts helv/cour . bound",
  "  grid hairlines .. 40px ink",
  "  streams ......... direct",
  "  xref offsets .... verified",
  "  heap 12.4mb -> 8.1mb",
];

const TERM_B = [
  "[inject] profile.md -> page",
  "[inject] skills[4] groups",
  "[inject] work[4] blocks",
  "[inject] stats[4] metrics",
  "[spring] 300 / 30 settled",
  "[blob] mime application/pdf",
  "[emit] 1 page // a4",
];

/* ---------- side terminal ---------- */

function TerminalPanel({
  title,
  lines,
  side,
  active,
}: {
  title: string;
  lines: string[];
  side: "A" | "B";
  active: boolean;
}) {
  return (
    <div className="relative self-start overflow-hidden bg-white border border-black/15 shadow-sm cyber-scanlines p-3 h-[150px] lg:h-[170px]">
      <div className="flex items-center gap-2 pb-2 mb-2 border-b border-black/10">
        <span className="w-1.5 h-1.5 bg-[#FF4500]" />
        <span className="font-mono text-[9px] font-bold tracking-widest text-[#0B0F19]">
          TERMINAL_{title}
        </span>
      </div>
      <div className="space-y-1">
        {lines.map((l, i) => (
          <motion.div
            key={`${title}-${i}-${l}`}
            initial={{ opacity: 0, x: side === "A" ? -6 : 6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className="font-mono text-[8.5px] truncate"
            style={{
              color: i === lines.length - 1 ? "#FF4500" : "#4A5261",
              willChange: "transform, opacity",
              backfaceVisibility: "hidden",
            }}
          >
            {l}
          </motion.div>
        ))}
        {lines.length === 0 && (
          <span className="font-mono text-[8.5px] text-[#767E8C]">
            {"// awaiting compile"}
          </span>
        )}
        {active && <span className="font-mono text-[9px] text-[#0B0F19] cyber-blink">█</span>}
      </div>
    </div>
  );
}

/* ---------- on-page document preview (mirrors resumeData / PDF) ---------- */

function PaperDocument({ genDate }: { genDate: string }) {
  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-white border border-black/10">
      <div className="h-2 shrink-0 bg-[#FF4500]" />
      <div className="flex-1 min-h-0 px-5 py-4 flex flex-col gap-3">
        {/* header */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-mono font-bold text-[17px] leading-none text-[#0B0F19]">
              {resumeData.name}
            </h3>
            <span className="font-mono text-[7px] font-bold tracking-widest text-[#0B0F19] bg-[#F2F4F3] border border-black/10 px-1.5 py-1 whitespace-nowrap">
              {resumeData.status.toUpperCase()}
            </span>
          </div>
          <p className="mt-1.5 font-mono text-[8px] uppercase tracking-[0.16em] text-[#FF4500]">
            {resumeData.role}
          </p>
          <p className="mt-1 font-mono text-[7px] text-[#767E8C]">
            {resumeData.contact.map((c) => c.value).join("  //  ")}
          </p>
        </div>
        <div className="h-px bg-black/10" />

        {/* profile */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[7.5px] font-bold tracking-widest text-[#FF4500]">
              [ 01 ] PROFILE
            </span>
            <span className="h-px flex-1 bg-black/10" />
          </div>
          <div className="mt-1.5 space-y-0.5">
            {resumeData.profile.map((line) => (
              <p key={line} className="text-[7.5px] leading-[1.45] text-[#4A5261]">
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* stats — injected with spring physics during compile */}
        <div className="relative flex border border-black/10 bg-[#F2F4F3]">
          <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#FF4500]" />
          <div className="grid grid-cols-4 flex-1 py-1.5">
            {resumeData.stats.map((s, i) => {
              const off = i % 2 === 0 ? -48 : 48;
              return (
                <motion.div
                  key={s.label}
                  initial={{ x: off, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    delay: 0.8 + i * 0.42,
                  }}
                  className="px-1.5 min-w-0"
                  style={{ willChange: "transform, opacity", backfaceVisibility: "hidden" }}
                >
                  <div
                    className={`font-mono font-bold text-[11px] leading-none ${
                      i % 2 === 0 ? "text-[#FF4500]" : "text-[#0B0F19]"
                    }`}
                  >
                    {s.value}
                  </div>
                  <div className="mt-1 font-mono text-[5.5px] uppercase tracking-wider text-[#767E8C]">
                    {s.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* skills */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[7.5px] font-bold tracking-widest text-[#FF4500]">
              [ 02 ] CORE SKILLS
            </span>
            <span className="h-px flex-1 bg-black/10" />
          </div>
          <div className="mt-1.5 space-y-1.5">
            {resumeData.skills.map((g) => (
              <div key={g.group}>
                <div className="font-mono text-[6.5px] font-bold uppercase tracking-widest text-[#0B0F19]">
                  {g.group}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {g.items.map((it) => (
                    <span
                      key={it}
                      className="font-mono text-[6px] text-[#0B0F19] bg-[#F2F4F3] border border-black/10 px-1.5 py-[3px]"
                    >
                      {it}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* work */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[7.5px] font-bold tracking-widest text-[#FF4500]">
              [ 03 ] SELECTED WORK
            </span>
            <span className="h-px flex-1 bg-black/10" />
          </div>
          <div className="mt-1.5 space-y-1.5">
            {resumeData.work.map((w) => (
              <div key={w.name}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono font-bold text-[8px] text-[#0B0F19] truncate">
                    {w.name}
                  </span>
                  <span className="font-mono text-[6px] text-[#767E8C] whitespace-nowrap">
                    {w.period}
                  </span>
                </div>
                <p className="text-[6.5px] leading-[1.4] text-[#4A5261]">{w.desc[0]}</p>
                <div className="mt-0.5 font-mono text-[5.5px] tracking-wide text-[#FF4500]">
                  {w.tags}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* footer */}
        <div className="mt-auto pt-1">
          <div className="relative h-px bg-black/10">
            <span className="absolute -top-px left-0 w-10 h-[2px] bg-[#FF4500]" />
          </div>
          <div className="flex justify-between font-mono text-[5.5px] text-[#767E8C] mt-1.5">
            <span>{`GENERATED ${genDate || "----"} // CLIENT-SIDE PDF`}</span>
            <span>PAGE 1/1</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- section ---------- */

export function CVPlayground() {
  const { ref: inViewRef, inView } = useInView<HTMLElement>();
  const [phase, setPhase] = useState<Phase>("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [linesA, setLinesA] = useState<string[]>([]);
  const [linesB, setLinesB] = useState<string[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [genDate, setGenDate] = useState("");
  const [preview, setPreview] = useState(false);
  const [compileId, setCompileId] = useState(0);

  const barRef = useRef<HTMLDivElement>(null);
  const asciiRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  /* pointer-driven document tilt (spring physics, transform-only) */
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateX = useSpring(useTransform(py, [-1, 1], [4, -4]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(px, [-1, 1], [-6, 6]), {
    stiffness: 300,
    damping: 30,
  });

  const start = useCallback(() => {
    setLogs([]);
    setLinesA([]);
    setLinesB([]);
    setPreview(false);
    setCompileId((n) => n + 1);
    setPhase("fly");
  }, []);

  /* auto-trigger once when the section scrolls in */
  useEffect(() => {
    if (!inView || startedRef.current) return;
    startedRef.current = true;
    const id = window.setTimeout(start, 400);
    return () => clearTimeout(id);
  }, [inView, start]);

  /* phase: fly — fallback if onAnimationComplete never fires */
  useEffect(() => {
    if (phase !== "fly") return;
    const id = window.setTimeout(() => setPhase("inject"), 1500);
    return () => clearTimeout(id);
  }, [phase]);

  /* phase: inject — telemetry logs, terminal streams, rAF progress, completion */
  useEffect(() => {
    if (phase !== "inject") return;

    const timeoutIds = LOG_SCRIPT.map((s) =>
      window.setTimeout(() => setLogs((prev) => [...prev, s.text]), s.at)
    );

    let ai = 0;
    let bi = 0;
    const intA = window.setInterval(() => {
      setLinesA((prev) => [...prev, TERM_A[ai++ % TERM_A.length]].slice(-8));
    }, 520);
    const intB = window.setInterval(() => {
      setLinesB((prev) => [...prev, TERM_B[bi++ % TERM_B.length]].slice(-8));
    }, 660);

    const t0 = performance.now();
    let raf = requestAnimationFrame(function tick(now: number) {
      const p = Math.min(1, (now - t0) / INJECT_MS);
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
      if (asciiRef.current) {
        const filled = Math.round(p * 18);
        asciiRef.current.textContent = `[${"#".repeat(filled)}${".".repeat(
          18 - filled
        )}] ${Math.round(p * 100)}%`;
      }
      if (p < 1) raf = requestAnimationFrame(tick);
    });

    const endId = window.setTimeout(() => setPhase("boom"), INJECT_MS + 140);

    return () => {
      timeoutIds.forEach((id) => clearTimeout(id));
      clearInterval(intA);
      clearInterval(intB);
      cancelAnimationFrame(raf);
      clearTimeout(endId);
    };
  }, [phase]);

  /* phase: boom — shockwave plays, then settle to ready */
  useEffect(() => {
    if (phase !== "boom") return;
    const id = window.setTimeout(() => setPhase("ready"), 850);
    return () => clearTimeout(id);
  }, [phase]);

  /* phase: ready — serve the uploaded resume PDF (animations untouched) */
  useEffect(() => {
    if (phase !== "ready") return;
    let cancelled = false;
    const id = window.setTimeout(() => {
      if (!cancelled) {
        setPdfUrl(RESUME_PDF_URL);
        setGenDate(new Date().toISOString().slice(0, 10));
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [phase]);

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width) * 2 - 1);
    py.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const onPointerLeave = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <section
      ref={inViewRef}
      className="relative min-h-screen px-6 py-20 bg-[#F2F4F3] overflow-hidden"
    >
      <div className="absolute inset-0 cyber-grid-bg opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        {/* header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ type: "spring", stiffness: 350, damping: 35 }}
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[#FF4500] tracking-widest">[06]</span>
            <span className="h-px flex-1 max-w-[60px] bg-[#FF4500]/30" />
            <span className="font-mono text-xs text-[#FF4500] tracking-widest uppercase">
              Resume Compiler
            </span>
          </div>
          <h2 className="mt-4 font-mono text-3xl md:text-5xl font-bold tracking-tight text-[#0B0F19]">
            CV <span className="text-[#0E7A56]">Playground</span>
          </h2>
          <p className="mt-4 text-[#4A5261] max-w-2xl font-mono text-sm">
            Compile and download the resume PDF — flying paper physics, live telemetry
            injection, and a Three.js particle shockwave. Downloads the uploaded
            Goutham_Resume.pdf.
          </p>
        </motion.div>

        {/* compiler container */}
        <div className="mt-10 relative bg-white border border-gray-300 shadow-sm">
          <div className="absolute inset-0 cyber-grid-bg opacity-25 pointer-events-none" />
          <span className="absolute -top-px -left-px z-10 w-5 h-5 border-t-2 border-l-2 border-[#FF4500]" />
          <span className="absolute -top-px -right-px z-10 w-5 h-5 border-t-2 border-r-2 border-[#FF4500]" />
          <span className="absolute -bottom-px -left-px z-10 w-5 h-5 border-b-2 border-l-2 border-[#FF4500]" />
          <span className="absolute -bottom-px -right-px z-10 w-5 h-5 border-b-2 border-r-2 border-[#FF4500]" />

          {/* container header */}
          <div className="relative z-10 flex items-center justify-between gap-3 border-b border-black/10 px-4 py-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2 h-2 bg-[#FF4500] shrink-0" />
              <span className="font-mono text-[10px] font-bold tracking-widest text-[#0B0F19]">
                RESUME_COMPILER
              </span>
              <span className="hidden sm:inline font-mono text-[10px] text-[#767E8C] truncate">
                {"// BUILD 2.4.1 · SPRING 300/30 · A4"}
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] shrink-0">
              <span
                className={`w-1.5 h-1.5 bg-[#FF4500] ${
                  phase === "idle" ? "" : "cyber-blink"
                }`}
              />
              <span className="text-[#767E8C]">PHASE:</span>
              <span className="font-bold text-[#FF4500]">{phase.toUpperCase()}</span>
            </div>
          </div>

          {/* stage + terminals */}
          <div className="relative z-10 grid grid-cols-2 lg:grid-cols-[190px_1fr_190px] gap-3 lg:gap-4 p-4">
            {/* stage */}
            <div
              className="col-span-2 lg:col-span-1 lg:order-2 relative flex flex-col items-center justify-center min-h-[620px] md:min-h-[660px] py-4"
              onPointerMove={onPointerMove}
              onPointerLeave={onPointerLeave}
            >
              {/* idle state */}
              {phase === "idle" && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6">
                  <div className="relative w-[170px] aspect-[210/297] border-2 border-dashed border-black/15 bg-white/60">
                    <span className="absolute top-1/2 left-3 right-3 h-px bg-black/10" />
                    <span className="absolute left-1/2 top-3 bottom-3 w-px bg-black/10" />
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] tracking-widest text-[#767E8C]">
                      RESUME.PDF
                    </span>
                    <span className="absolute -top-1 -left-1 w-3 h-3 border-t border-l border-[#FF4500]/60" />
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b border-r border-[#FF4500]/60" />
                  </div>
                  <motion.button
                    type="button"
                    onClick={start}
                    whileHover={{ y: -2 }}
                    whileTap={{ y: 1 }}
                    className="px-6 py-3 font-mono text-xs font-bold tracking-widest bg-[#FF4500] text-[#0B0F19] border-2 border-[#0B0F19] shadow-[4px_4px_0_#0B0F19] cursor-pointer"
                  >
                    [ COMPILE RESUME ]
                  </motion.button>
                </div>
              )}

              {/* flying paper */}
              {phase !== "idle" && (
                <motion.div
                  key={compileId}
                  initial={{ x: -800, y: -400, rotate: -45, opacity: 0 }}
                  animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  onAnimationComplete={() => {
                    if (phase === "fly") setPhase("inject");
                  }}
                  style={{
                    rotateX,
                    rotateY,
                    transformPerspective: 1600,
                    willChange: "transform, opacity",
                    backfaceVisibility: "hidden",
                  }}
                  className="relative w-[min(88%,400px)] aspect-[210/297] shadow-[0_1px_3px_rgba(11,15,25,0.07),0_18px_44px_rgba(11,15,25,0.12)]"
                >
                  <PaperDocument genDate={genDate} />

                  {/* injection overlay */}
                  <AnimatePresence>
                    {phase === "inject" && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="absolute inset-0 z-10 overflow-hidden flex flex-col items-center justify-center gap-3 px-6 bg-white/92 pointer-events-none"
                      >
                        <div className="absolute inset-0 cyber-scanlines opacity-60" />
                        <motion.div
                          className="absolute top-0 left-0 right-0 h-[7%] bg-[#FF4500]/10"
                          animate={{ y: ["0%", "1300%"] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        />

                        <div className="relative font-mono text-[7.5px] tracking-widest text-[#767E8C]">
                          RESUME.PDF :: A4 / 210 x 297mm
                        </div>
                        <div
                          ref={asciiRef}
                          className="relative font-mono text-[11px] font-bold text-[#0B0F19]"
                        >
                          [#..................] 0%
                        </div>
                        <div className="relative w-full max-w-[280px] h-1 bg-black/10 overflow-hidden">
                          <div
                            ref={barRef}
                            className="h-full w-full bg-[#FF4500] origin-left"
                            style={{ transform: "scaleX(0)", willChange: "transform" }}
                          />
                        </div>
                        <div className="relative w-full max-w-[300px] space-y-1">
                          {logs.map((l, i) => (
                            <motion.div
                              key={l}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ type: "spring", stiffness: 350, damping: 35 }}
                              className={`font-mono text-[8px] truncate ${
                                i === logs.length - 1
                                  ? "text-[#FF4500] font-bold"
                                  : "text-[#4A5261]"
                              }`}
                            >
                              {l}
                            </motion.div>
                          ))}
                        </div>
                        <span className="relative font-mono text-[9px] text-[#FF4500] cyber-blink">
                          _
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ready: stamp + meta */}
                  {phase === "ready" && (
                    <>
                      <motion.div
                        initial={{ scale: 1.8, opacity: 0, rotate: -16 }}
                        animate={{ scale: 1, opacity: 1, rotate: -7 }}
                        transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.25 }}
                        className="absolute bottom-4 right-3 z-10 border-2 border-[#0E7A56] bg-white/85 px-2 py-1 font-mono text-[9px] font-bold tracking-widest text-[#0E7A56]"
                        style={{ willChange: "transform, opacity", backfaceVisibility: "hidden" }}
                      >
                        COMPILED <span className="text-[#FF4500]">OK</span>
                      </motion.div>
                      <div className="absolute bottom-4 left-3 z-10 font-mono text-[7px] text-[#767E8C]">
                        PDF READY · {genDate || "----"} · ZERO DEPS
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* injection beams (desktop flanks) */}
              <AnimatePresence>
                {phase === "inject" && (
                  <>
                    {[0, 1].map((i) => (
                      <motion.span
                        key={`beam-l-${i}`}
                        className={`hidden lg:block absolute left-0 h-[2px] w-[110px] origin-left ${
                          i % 2 === 0 ? "bg-[#FF4500]" : "bg-[#0B0F19]"
                        }`}
                        style={{ top: `${30 + i * 34}%`, willChange: "transform, opacity" }}
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: [0, 1, 0], opacity: [0, 1, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 1.15,
                          repeat: Infinity,
                          delay: i * 0.5,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                    {[0, 1].map((i) => (
                      <motion.span
                        key={`beam-r-${i}`}
                        className={`hidden lg:block absolute right-0 h-[2px] w-[110px] origin-right ${
                          i % 2 === 0 ? "bg-[#0B0F19]" : "bg-[#FF4500]"
                        }`}
                        style={{ top: `${38 + i * 30}%`, willChange: "transform, opacity" }}
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: [0, 1, 0], opacity: [0, 1, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 1.15,
                          repeat: Infinity,
                          delay: 0.25 + i * 0.5,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </>
                )}
              </AnimatePresence>

              {/* boom: flash + ring + WebGL shockwave */}
              {phase === "boom" && (
                <>
                  <motion.div
                    className="absolute inset-0 z-20 bg-[#FF4500]/25 pointer-events-none"
                    initial={{ opacity: 0.85 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    aria-hidden="true"
                  />
                  <div
                    className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                    aria-hidden="true"
                  >
                    <motion.span
                      className="block w-36 h-36 rounded-full border-2 border-[#FF4500]"
                      initial={{ scale: 0.3, opacity: 0.95 }}
                      animate={{ scale: 2.7, opacity: 0 }}
                      transition={{ duration: 0.75, ease: "easeOut" }}
                    />
                  </div>
                  <ResumeShockwave />
                </>
              )}

              {/* ready: actions */}
              {phase === "ready" && pdfUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.12 }}
                  className="relative z-20 mt-7 flex flex-wrap items-center justify-center gap-3 px-2"
                  style={{ willChange: "transform, opacity", backfaceVisibility: "hidden" }}
                >
                  <a
                    href={pdfUrl}
                    download={RESUME_FILENAME}
                    className="px-6 py-3.5 sm:px-8 font-mono text-xs sm:text-sm font-bold tracking-widest bg-[#FF4500] text-[#0B0F19] border-2 border-[#0B0F19] shadow-[5px_5px_0_#0B0F19] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#0B0F19] active:translate-y-0 active:shadow-[3px_3px_0_#0B0F19] transition-all cursor-pointer"
                  >
                    [ DOWNLOAD RESUME.PDF ]
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreview((p) => !p)}
                    className="px-5 py-3 font-mono text-xs font-bold tracking-widest bg-white text-[#0B0F19] border-2 border-[#0B0F19] shadow-[4px_4px_0_#0B0F19] hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    {preview ? "[ HIDE PREVIEW ]" : "[ LIVE PREVIEW ]"}
                  </button>
                  <button
                    type="button"
                    onClick={start}
                    className="px-5 py-3 font-mono text-xs font-bold tracking-widest bg-white text-[#4A5261] border-2 border-black/20 shadow-[4px_4px_0_rgba(11,15,25,0.15)] hover:-translate-y-0.5 hover:border-[#0B0F19] hover:text-[#0B0F19] transition-all cursor-pointer"
                  >
                    [ RECOMPILE ]
                  </button>
                </motion.div>
              )}
            </div>

            {/* terminals */}
            <div className="lg:order-1">
              <TerminalPanel title="A" lines={linesA} side="A" active={phase === "inject"} />
            </div>
            <div className="lg:order-3">
              <TerminalPanel title="B" lines={linesB} side="B" active={phase === "inject"} />
            </div>
          </div>

          {/* live preview */}
          {preview && pdfUrl && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative z-10 mx-4 mb-4 border border-gray-300 overflow-hidden bg-[#E4E7E6]"
              style={{ willChange: "transform, opacity", backfaceVisibility: "hidden" }}
            >
              <div className="flex items-center justify-between gap-2 border-b border-black/10 bg-white px-3 py-1.5">
                <span className="font-mono text-[9px] font-bold tracking-widest text-[#0B0F19] truncate">
                  LIVE PREVIEW :: RESUME.PDF
                </span>
                <span className="font-mono text-[9px] text-[#767E8C] shrink-0">
                  BLOB URL · 1 PAGE
                </span>
              </div>
              <iframe
                src={pdfUrl}
                title="Resume PDF live preview"
                className="block w-full h-[540px] border-0 bg-white"
              />
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
