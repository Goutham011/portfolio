"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "@/lib/hooks";
import { hash01 } from "@/lib/random";
import { CNNFeature3D } from "@/components/three/CNNFeature3D";

interface LayerDef {
  name: string;
  type: string;
  detail: string;
  outputShape: string;
  params: string;
  color: string;
}

const layers: LayerDef[] = [
  { name: "Input", type: "IMAGE", detail: "224 × 224 × 3 RGB tensor fed into the network", outputShape: "(1, 3, 224, 224)", params: "0", color: "#767E8C" },
  { name: "Conv2D", type: "CONVOLUTION", detail: "64 filters × 3×3 kernel, stride 1, padding 1 — extracts edges, textures, and low-level features", outputShape: "(1, 64, 224, 224)", params: "1,792", color: "#FF4500" },
  { name: "ReLU", type: "ACTIVATION", detail: "f(x) = max(0, x) — introduces non-linearity, sparsifying activations", outputShape: "(1, 64, 224, 224)", params: "0", color: "#0E7A56" },
  { name: "MaxPool", type: "POOLING", detail: "2×2 window, stride 2 — spatial downsampling, translation invariance", outputShape: "(1, 64, 112, 112)", params: "0", color: "#2249C7" },
  { name: "Conv2D ×2", type: "CONVOLUTION", detail: "128 + 128 filters — mid-level feature extraction (shapes, patterns)", outputShape: "(1, 128, 112, 112)", params: "73,856", color: "#FF4500" },
  { name: "BatchNorm", type: "NORMALIZATION", detail: "Normalizes activations per-batch — stabilizes training, higher learning rates", outputShape: "(1, 128, 112, 112)", params: "256", color: "#B45309" },
  { name: "GlobalAvgPool", type: "POOLING", detail: "Averages each feature map to a single value — reduces spatial dims to 1", outputShape: "(1, 128, 1, 1)", params: "0", color: "#2249C7" },
  { name: "Dense", type: "FULLY CONNECTED", detail: "128 → 64 → 10 logits — classification head with softmax output", outputShape: "(1, 10)", params: "8,266", color: "#0E7A56" },
];

function LayerMatrix({ layer, isActive }: { layer: LayerDef; isActive: boolean }) {
  const gridSize = 8;
  const cells = [];
  for (let i = 0; i < gridSize * gridSize; i++) {
    const intensity = hash01(i + layer.name.length * 13);
    cells.push(
      <motion.div
        key={i}
        className="rounded-[1px]"
        initial={{ opacity: 0.1, scale: 0.8 }}
        animate={{
          opacity: isActive ? 0.3 + intensity * 0.7 : 0.1 + intensity * 0.3,
          scale: isActive ? 1 : 0.85,
        }}
        transition={{ type: "spring", stiffness: 350, damping: 35, delay: isActive ? i * 0.008 : 0 }}
        style={{
          backgroundColor: layer.color,
          width: "100%",
          aspectRatio: "1",
          willChange: "opacity, transform",
          backfaceVisibility: "hidden",
        }}
      />
    );
  }
  return (
    <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, width: "100%" }}>
      {cells}
    </div>
  );
}

export function CNNVisualizer() {
  const { ref, inView } = useInView<HTMLElement>();
  const [activeIdx, setActiveIdx] = useState(2);
  const [autoPlay, setAutoPlay] = useState(true);
  const active = layers[activeIdx];

  useEffect(() => {
    if (!autoPlay || !inView) return;
    const iv = setInterval(() => setActiveIdx(i => (i + 1) % layers.length), 2200);
    return () => clearInterval(iv);
  }, [autoPlay, inView]);

  return (
    <section ref={ref} className="relative min-h-screen px-6 py-20 bg-[#F2F4F3] overflow-hidden">
      <div className="absolute inset-0 cyber-grid-bg opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }} transition={{ type: "spring", stiffness: 350, damping: 35 }}>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[#FF4500] tracking-widest">[04]</span>
            <span className="h-px flex-1 max-w-[60px] bg-[#FF4500]/30" />
            <span className="font-mono text-xs text-[#FF4500] tracking-widest uppercase">Model Internals</span>
          </div>
          <h2 className="mt-4 font-mono text-3xl md:text-5xl font-bold tracking-tight text-[#0B0F19]">
            CNN <span className="text-[#2249C7]">Visualizer</span>
          </h2>
          <p className="mt-4 text-[#4A5261] max-w-2xl font-mono text-sm">
            Click any layer to inspect its operation, output tensor shape, and learnable parameters.
          </p>
        </motion.div>

        {/* 3D feature extractor */}
        <div className="mt-8 relative h-[360px] md:h-[440px] border border-black/15 bg-white shadow-sm overflow-hidden cyber-scanlines">
          <span className="absolute -top-px -left-px z-10 w-5 h-5 border-t border-l border-[#FF4500]/40" />
          <span className="absolute -top-px -right-px z-10 w-5 h-5 border-t border-r border-[#FF4500]/40" />
          <span className="absolute -bottom-px -left-px z-10 w-5 h-5 border-b border-l border-[#FF4500]/40" />
          <span className="absolute -bottom-px -right-px z-10 w-5 h-5 border-b border-r border-[#FF4500]/40" />

          <div className="absolute top-3 left-4 z-10 flex items-center gap-2 pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500] cyber-blink" />
            <span className="font-mono text-[10px] text-[#767E8C] tracking-widest">
              FEATURE_EXTRACTOR_3D · DRAG TO ROTATE · CLICK A LAYER TO INSPECT
            </span>
          </div>

          <CNNFeature3D
            activeIdx={activeIdx}
            onSelect={(i) => {
              setActiveIdx(i);
              setAutoPlay(false);
            }}
          />

          <div className="absolute bottom-3 left-4 z-10 flex flex-wrap gap-x-4 gap-y-1 pointer-events-none">
            {[
              { n: "INPUT", c: "#767E8C" },
              { n: "CONV2D", c: "#FF4500" },
              { n: "RELU", c: "#0E7A56" },
              { n: "MAXPOOL", c: "#2249C7" },
              { n: "DENSE", c: "#B45309" },
            ].map((l) => (
              <span key={l.n} className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest text-[#767E8C]">
                <span className="w-1.5 h-1.5" style={{ backgroundColor: l.c }} />
                {l.n}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-10 flex items-center gap-4">
          <button
            onClick={() => setAutoPlay(p => !p)}
            className="px-4 py-1.5 font-mono text-xs tracking-widest border rounded-sm transition-all"
            style={{
              color: autoPlay ? "#FF4500" : "#767E8C",
              borderColor: autoPlay ? "rgba(255,69,0,0.45)" : "rgba(11,15,25,0.15)",
              backgroundColor: autoPlay ? "rgba(255,69,0,0.06)" : "transparent",
            }}
          >
            {autoPlay ? "⏸ PAUSE" : "▶ AUTO"}
          </button>
          <span className="font-mono text-[10px] text-[#767E8C] tracking-widest">
            {active.type} :: {active.name}
          </span>
        </div>

        {/* Layer pipeline strip */}
        <div className="mt-6 overflow-x-auto pb-4 -mx-6 px-6">
          <div className="flex items-stretch gap-0 min-w-max">
            {layers.map((layer, i) => (
              <div key={layer.name} className="flex items-center">
                <button
                  onClick={() => { setActiveIdx(i); setAutoPlay(false); }}
                  className="relative px-4 py-3 bg-white border rounded-sm transition-all cursor-pointer group"
                  style={{
                    borderColor: i === activeIdx ? layer.color : "rgba(11,15,25,0.1)",
                    boxShadow: i === activeIdx ? `0 0 20px ${layer.color}33` : "none",
                    willChange: "border-color, box-shadow",
                  }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: layer.color, opacity: i === activeIdx ? 1 : 0.4, boxShadow: i === activeIdx ? `0 0 6px ${layer.color}` : "none" }} />
                    <span className="font-mono text-[11px] font-bold whitespace-nowrap" style={{ color: i === activeIdx ? layer.color : "#4A5261" }}>
                      {layer.name}
                    </span>
                    <span className="font-mono text-[9px] text-[#767E8C] uppercase tracking-wider">{layer.type}</span>
                  </div>
                </button>
                {i < layers.length - 1 && (
                  <span className="text-[#767E8C] font-mono text-xs px-1">→</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className="mt-8 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 relative bg-white border border-black/15 shadow-sm rounded-sm p-6 cyber-scanlines overflow-hidden"
            style={{ willChange: "transform, opacity", backfaceVisibility: "hidden" }}>
            <span className="absolute -top-px -left-px w-4 h-4 border-t border-l border-black/20" />
            <span className="absolute -top-px -right-px w-4 h-4 border-t border-r border-black/20" />
            <span className="absolute -bottom-px -left-px w-4 h-4 border-b border-l border-black/20" />
            <span className="absolute -bottom-px -right-px w-4 h-4 border-b border-r border-black/20" />

            <AnimatePresence mode="wait">
              <motion.div key={active.name}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                transition={{ type: "spring", stiffness: 350, damping: 35 }}
                style={{ willChange: "transform, opacity", backfaceVisibility: "hidden" }}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: active.color, boxShadow: `0 0 8px ${active.color}` }} />
                  <span className="font-mono text-xs tracking-widest" style={{ color: active.color }}>{active.type}</span>
                </div>
                <h3 className="font-mono text-2xl font-bold text-[#0B0F19] mb-3">{active.name}</h3>
                <p className="text-[#4A5261] text-sm leading-relaxed font-mono">{active.detail}</p>

                <div className="mt-6 space-y-3">
                  <div className="flex justify-between font-mono text-xs border-b border-black/10 pb-2">
                    <span className="text-[#767E8C]">OUTPUT_SHAPE</span>
                    <span className="text-[#FF4500]">{active.outputShape}</span>
                  </div>
                  <div className="flex justify-between font-mono text-xs border-b border-black/10 pb-2">
                    <span className="text-[#767E8C]">PARAMS</span>
                    <span className="text-[#0E7A56]">{active.params}</span>
                  </div>
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-[#767E8C]">LEARNABLE</span>
                    <span className="text-[#B45309]">{active.params === "0" ? "NO" : "YES"}</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="lg:col-span-2 bg-white border border-black/15 shadow-sm rounded-sm p-6"
            style={{ willChange: "transform, opacity", backfaceVisibility: "hidden" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs text-[#767E8C] tracking-widest">FEATURE_MAP (8×8 SAMPLE)</span>
              <span className="font-mono text-xs" style={{ color: active.color }}>{active.name}</span>
            </div>
            <div className="max-w-[320px]">
              <AnimatePresence mode="wait">
                <motion.div key={active.name}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 350, damping: 35 }}
                  style={{ willChange: "transform, opacity", backfaceVisibility: "hidden" }}>
                  <LayerMatrix layer={active} isActive />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-5 flex gap-4 font-mono text-[10px] text-[#767E8C]">
              <span>■ HIGH_ACT</span>
              <span>□ LOW_ACT</span>
              <span className="ml-auto">GRID: 8×8 = 64 neurons</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
