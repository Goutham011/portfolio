"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useInView } from "@/lib/hooks";

const skills = [
  { name: "Python / SQL", level: 92, color: "#FF4500" },
  { name: "Data Pipelines / ETL", level: 88, color: "#2249C7" },
  { name: "Data Governance / Quality", level: 87, color: "#0E7A56" },
  { name: "BigQuery / Airflow", level: 85, color: "#B45309" },
  { name: "Spark / Kafka", level: 83, color: "#FF4500" },
  { name: "Power BI / Looker", level: 81, color: "#2249C7" },
];

const commands: Record<string, string[]> = {
  help: [
    "Available commands:",
    "  help        — show this message",
    "  skills      — display skill matrix",
    "  models      — list deployed models",
    "  train       — simulate training run",
    "  contact     — display contact channels",
    "  clear       — clear terminal",
  ],
  skills: skills.map(s => `  ${s.name.padEnd(20)} ${"█".repeat(Math.round(s.level / 5))}${"░".repeat(20 - Math.round(s.level / 5))} ${s.level}%`),
  models: [
    "  #   PIPELINE          STATUS      THROUGHPUT",
    "  ─────────────────────────────────────────",
    "  1   etl-bigquery      ● ACTIVE    10K+/day",
    "  2   airflow-dags      ● ACTIVE    scheduled",
    "  3   spark-stream      ● ACTIVE    30+ fps",
    "  4   kafka-feed        ● ACTIVE    live",
    "  5   powerbi-dash      ● ACTIVE    24h refresh",
  ],
  contact: [
    "  EMAIL     gouthamsaigoparaju@gmail.com",
    "  GITHUB    github.com/Goutham011",
    "  LINKEDIN  linkedin.com/in/goutham-sai-goparaju-574555262",
  ],
  train: [
    "  [EPOCH 1/3] loss=2.417  acc=0.342  lr=0.001",
    "  [EPOCH 2/3] loss=0.891  acc=0.781  lr=0.001",
    "  [EPOCH 3/3] loss=0.214  acc=0.943  lr=0.0001",
    "  Training complete. Best val_acc = 0.943",
    "  Model checkpoint saved → ./checkpoints/best.pt",
  ],
};

const unknown = (cmd: string) => [`  bash: ${cmd}: command not found. Type 'help' for available commands.`];

export function MLTerminal() {
  const { ref } = useInView<HTMLDivElement>();
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<{ type: "cmd" | "out"; text: string }[]>([
    { type: "out", text: "CyberCore ML Terminal v2.1.0" },
    ...commands.help.map((t) => ({ type: "out" as const, text: t })),
    { type: "out", text: "" },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history]);

  const runCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    if (!trimmed) return;

    if (trimmed === "clear") {
      setHistory([]);
      return;
    }

    const output = commands[trimmed] || unknown(trimmed);
    setHistory(prev => [
      ...prev,
      { type: "cmd", text: `$ ${cmd}` },
      ...output.map(t => ({ type: "out" as const, text: t })),
      { type: "out", text: "" },
    ]);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runCommand(input);
    setInput("");
  };

  return (
    <section className="relative min-h-screen px-6 py-20 bg-gradient-to-b from-[#F2F4F3] via-[#FFFFFF] to-[#F2F4F3] overflow-hidden">
      <div className="absolute inset-0 cyber-grid-bg opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }} transition={{ type: "spring", stiffness: 350, damping: 35 }}>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-[#FF4500] tracking-widest">[05]</span>
                <span className="h-px flex-1 max-w-[60px] bg-[#FF4500]/30" />
                <span className="font-mono text-xs text-[#FF4500] tracking-widest uppercase">Skills Matrix</span>
              </div>
              <h2 className="mt-4 font-mono text-3xl md:text-5xl font-bold tracking-tight text-[#0B0F19]">
                Capability <span className="text-[#0E7A56]">Readout</span>
              </h2>
              <p className="mt-4 text-[#4A5261] max-w-lg font-mono text-sm">
                Proficiency telemetry across data management disciplines. Interact with the terminal for detailed command output.
              </p>

              <div className="mt-8 space-y-5">
                {skills.map((skill, i) => (
                  <motion.div key={skill.name}
                    initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} transition={{ type: "spring", stiffness: 350, damping: 35, delay: i * 0.08 }}
                    style={{ willChange: "transform, opacity", backfaceVisibility: "hidden" }}>
                    <div className="flex justify-between font-mono text-xs mb-1.5">
                      <span className="text-[#4A5261]">{skill.name}</span>
                      <span style={{ color: skill.color }}>{skill.level}%</span>
                    </div>
                    <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${skill.color}66, ${skill.color})`,
                          boxShadow: `0 0 8px ${skill.color}55`,
                          transformOrigin: "left",
                          willChange: "transform",
                          backfaceVisibility: "hidden",
                        }}
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: skill.level / 100 }}
                        viewport={{ once: true }}
                        transition={{ type: "spring", stiffness: 350, damping: 35, delay: 0.3 + i * 0.1 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <div ref={ref}>
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }} transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="relative bg-white border border-black/15 shadow-sm rounded-sm overflow-hidden"
              style={{ boxShadow: "0 1px 3px rgba(11,15,25,0.07), 0 14px 34px rgba(11,15,25,0.09)", willChange: "transform, opacity", backfaceVisibility: "hidden" }}>
              <span className="absolute -top-px -left-px w-4 h-4 border-t border-l border-[#FF4500] z-10" />
              <span className="absolute -top-px -right-px w-4 h-4 border-t border-r border-[#FF4500] z-10" />
              <span className="absolute -bottom-px -left-px w-4 h-4 border-b border-l border-[#FF4500] z-10" />
              <span className="absolute -bottom-px -right-px w-4 h-4 border-b border-r border-[#FF4500] z-10" />

              {/* title bar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/15 bg-white">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF4500]/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B45309]/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0E7A56]/60" />
                </div>
                <span className="font-mono text-[10px] text-[#767E8C] tracking-widest">ml-terminal — bash</span>
                <span className="font-mono text-[10px] text-[#0E7A56]">●</span>
              </div>

              {/* terminal body */}
              <div ref={scrollRef} onClick={() => inputRef.current?.focus()}
                className="h-[420px] overflow-y-auto p-4 font-mono text-xs leading-relaxed cursor-text">
                {history.map((entry, i) => (
                  <div key={i} className={entry.type === "cmd" ? "text-[#FF4500]" : "text-[#4A5261]"}>
                    {entry.text || "\u00A0"}
                  </div>
                ))}
              </div>

              {/* input */}
              <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3 border-t border-black/15 bg-white">
                <span className="text-[#0E7A56] font-mono text-xs shrink-0">$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 bg-transparent text-[#0B0F19] font-mono text-xs outline-none placeholder-[#767E8C]"
                  placeholder="type a command..."
                  spellCheck={false}
                  autoComplete="off"
                />
                <span className="w-2 h-4 bg-[#FF4500] cyber-blink shrink-0" />
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
