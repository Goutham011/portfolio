"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BootLine {
  text: string;
  delay: number;
  ok?: boolean;
}

const bootLines: BootLine[] = [
  { text: "[INIT] Booting neural engine v4.2.0...", delay: 0 },
  { text: "[INIT] Detecting GPU: NVIDIA A100 80GB", delay: 350 },
  { text: "[ OK ] CUDA kernels compiled: 1,024/1,024", delay: 700 },
  { text: "[INIT] Loading neural weights...", delay: 1100 },
  { text: "[ OK ] Transformer weights loaded: 175B params", delay: 1500 },
  { text: "[INIT] Compiling ONNX graph optimization passes", delay: 1900 },
  { text: "[ OK ] TensorRT engine built in 340ms", delay: 2300 },
  { text: "[INIT] Initializing computer vision pipeline", delay: 2600 },
  { text: "[ OK ] YOLOv8 detector warmed up", delay: 3000 },
  { text: "[INIT] Mounting telemetry HUD", delay: 3300 },
  { text: "[ OK ] All systems nominal", delay: 3600, ok: true },
];

const TOTAL_DURATION = 4600;

export function BootLoader({ onComplete }: { onComplete: () => void }) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showCore, setShowCore] = useState(false);
  const [done, setDone] = useState(false);

  const finish = useCallback(() => {
    setDone(true);
    setTimeout(onComplete, 600);
  }, [onComplete]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    bootLines.forEach((line, i) => {
      timers.push(
        setTimeout(() => setVisibleLines(i + 1), line.delay + 200)
      );
    });

    const start = performance.now();
    let raf: number;
    const tick = () => {
      const elapsed = performance.now() - start;
      const p = Math.min(elapsed / TOTAL_DURATION, 1);
      setProgress(p);
      if (p >= 1) {
        setShowCore(true);
        timers.push(setTimeout(finish, 800));
      } else {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf);
    };
  }, [finish]);

  const barLength = 40;
  const filled = Math.floor(progress * barLength);
  const bar =
    "█".repeat(filled) + "░".repeat(barLength - filled);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-[#F2F4F3] flex items-center justify-center overflow-hidden"
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 35 }}
          style={{ willChange: "opacity", backfaceVisibility: "hidden" }}
        >
          <div className="absolute inset-0 cyber-grid-bg opacity-40" />

          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-24 h-24 border-t-2 border-l-2 border-[#FF4500]/60" />
            <div className="absolute top-0 right-0 w-24 h-24 border-t-2 border-r-2 border-[#FF4500]/60" />
            <div className="absolute bottom-0 left-0 w-24 h-24 border-b-2 border-l-2 border-[#FF4500]/60" />
            <div className="absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 border-[#FF4500]/60" />
          </div>

          <div className="relative z-10 w-full max-w-xl px-6 font-mono text-sm">
            <div className="mb-6 text-center">
              <div className="text-[#FF4500] text-glow-cyan text-xs tracking-[0.3em] uppercase mb-1">
                Neural Engine Boot Sequence
              </div>
              <div className="text-[#767E8C] text-xs">v4.2.0 // CYBERCORE-OS</div>
            </div>

            <div className="min-h-[220px] space-y-1.5">
              {bootLines.slice(0, visibleLines).map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 350, damping: 35 }}
                  className={
                    line.ok
                      ? "text-[#0E7A56]"
                      : line.text.includes("[ OK ]")
                        ? "text-[#0E7A56]"
                        : "text-[#4A5261]"
                  }
                >
                  {line.text}
                </motion.div>
              ))}
              {visibleLines < bootLines.length && (
                <span className="inline-block w-2 h-4 bg-[#FF4500] cyber-blink align-middle" />
              )}
            </div>

            <div className="mt-6">
              <div className="flex justify-between text-xs text-[#767E8C] mb-2">
                <span>PROGRESS</span>
                <span className="text-[#FF4500]">{Math.floor(progress * 100)}%</span>
              </div>
              <div className="text-[#FF4500] text-xs whitespace-pre text-glow-cyan">
                [{bar}]
              </div>
            </div>

            <div className="mt-4 flex justify-between text-xs text-[#767E8C]">
              <span>VRAM 78/80 GB</span>
              <span>LATENCY 12ms</span>
              <span className="text-[#0E7A56]">● ONLINE</span>
            </div>

            <AnimatePresence>
              {showCore && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 350, damping: 35 }}
                  className="mt-8 flex flex-col items-center"
                >
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <div
                      className="absolute inset-0 rounded-full border-2 border-[#FF4500] cyber-pulse-ring"
                    />
                    <div
                      className="absolute inset-2 rounded-full border border-[#2249C7] cyber-pulse-ring"
                      style={{ animationDelay: "0.4s" }}
                    />
                    <div className="w-4 h-4 rounded-full bg-[#FF4500] text-glow-cyan" />
                  </div>
                  <div className="mt-3 text-[#0E7A56] text-xs tracking-widest uppercase">
                    Core Activated
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
