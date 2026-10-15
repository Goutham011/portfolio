"use client";

import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { motion } from "framer-motion";
import { useInView } from "@/lib/hooks";
import { hash01 } from "@/lib/random";
import { getCircularParticleTexture } from "@/lib/particleTexture";

interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  color: string;
  icon: string;
  href?: string;
}

const projects: Project[] = [
  { id: "1", title: "Self-Driving Car", description: "Real-time safety system pairing YOLOv3 traffic-light detection (92% accuracy) with dlib-based drowsiness monitoring. Data preparation pipelines on Apache Spark and Kafka stream live video at 30+ FPS, validated across 50+ hours of driving footage", tags: ["YOLOv3", "OpenCV", "PyTorch"], color: "#B45309", icon: "layers", href: "https://github.com/Goutham011/Self-Driving_car" },
  { id: "2", title: "Bankterm", description: "Term-deposit subscription prediction on the Kaggle Bank Marketing dataset, with preprocessing, EDA, and 10 benchmarked classifiers tuned by grid search under nested cross-validation. CatBoost won at 85.89% test accuracy (86.58% CV mean), beating the 82-84% pack to automate retention insights", tags: ["CatBoost", "XGBoost", "Scikit-learn"], color: "#FF4500", icon: "server", href: "https://github.com/Goutham011/Bankterm" },
  { id: "3", title: "Groupbuy Inventory Intelligence", description: "XGBoost demand forecasting + reorder engine that flags stockouts 4 days early and surfaced $4,275 in overstock. Cuts MAE 6.87 → 3.44 (39.5% vs baseline) with nightly auto-retrain via GitHub Actions. Live on Streamlit Cloud.", tags: ["XGBoost", "Streamlit", "MLOps"], color: "#FF4500", icon: "chart", href: "https://github.com/Goutham011/groupbuy-inventory-intelligence" },
  { id: "4", title: "Traffic Counting CV", description: "YOLOv8 + ByteTrack vehicle detection with virtual line-crossing counter. Majority-vote categories, density analytics, HTML reports, CustomTkinter desktop + web GUIs for pre-recorded CCTV.", tags: ["YOLOv8", "ByteTrack", "OpenCV"], color: "#2249C7", icon: "eye", href: "https://github.com/Goutham011/traffic-counting-cv" },
  { id: "5", title: "Resume Job Matcher", description: "FastAPI service scoring resume↔JD fit with Sentence-Transformer semantic similarity + skill-gap analysis. PDF upload, REST API with docs, pytest + Black/Ruff CI.", tags: ["FastAPI", "NLP", "Sentence-Transformers"], color: "#0E7A56", icon: "zap", href: "https://github.com/Goutham011/resume-job-matcher" },
  { id: "6", title: "YTComments Sentiment", description: "Real-time YouTube comment sentiment with Kafka + Spark + TextBlob, visualized in Streamlit. Dockerized (goutham16/ytcomments) with compose for Kafka/Spark/dashboard.", tags: ["Kafka", "Spark", "Streamlit"], color: "#2249C7", icon: "crosshair", href: "https://github.com/Goutham011/YTComments" },
];

function ProjectIcon({ name }: { name: string }) {
  const svgProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "w-10 h-10",
    "aria-hidden": true,
  };
  switch (name) {
    case "eye":
      return (
        <svg {...svgProps}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "cpu":
      return (
        <svg {...svgProps}>
          <rect x="6" y="6" width="12" height="12" rx="2" />
          <rect x="10" y="10" width="4" height="4" />
          <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
        </svg>
      );
    case "layers":
      return (
        <svg {...svgProps}>
          <path d="M12 2 2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      );
    case "zap":
      return (
        <svg {...svgProps}>
          <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
        </svg>
      );
    case "crosshair":
      return (
        <svg {...svgProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
        </svg>
      );
    case "server":
      return (
        <svg {...svgProps}>
          <rect x="2" y="3" width="20" height="7" rx="2" />
          <rect x="2" y="14" width="20" height="7" rx="2" />
          <path d="M6 6.5h.01M6 17.5h.01" />
        </svg>
      );
    case "chart":
      return (
        <svg {...svgProps}>
          <path d="M3 21h18" />
          <path d="M7 21v-7M12 21V5M17 21v-10" />
        </svg>
      );
    default:
      return null;
  }
}

function BackgroundParticles({ count, spread }: { count: number; spread: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.01;
      pointsRef.current.rotation.x += delta * 0.005;
    }
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const projectColors = projects.map(p => new THREE.Color(p.color));
    for (let i = 0; i < count; i++) {
      const theta = hash01(i * 4 + 1) * Math.PI * 2;
      const phi = Math.acos(2 * hash01(i * 4 + 2) - 1);
      const r = spread * (0.3 + hash01(i * 4 + 3) * 0.7);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi) - 3;
      const color = projectColors[Math.floor(hash01(i * 5 + 4) * projectColors.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [count, spread]);

  const material = useMemo(() => new THREE.PointsMaterial({
    size: 1.2,
    map: getCircularParticleTexture(),
    transparent: true,
    opacity: 0.25,
    alphaTest: 0.01,
    vertexColors: true,
    sizeAttenuation: true,
    blending: THREE.NormalBlending,
    depthWrite: false,
  }), []);

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled />;
}

function Thinstrip({
  project,
  index,
  active,
  onActivate,
}: {
  project: Project;
  index: number;
  active: boolean;
  onActivate: () => void;
}) {
  return (
    <div
      className={`cyber-thinstrip group relative h-[460px] md:h-[500px] shrink-0 cursor-pointer overflow-hidden bg-white border ${active ? "cyber-thinstrip-active" : ""}`}
      style={{
        borderColor: active ? `${project.color}55` : "rgba(11,15,25,0.15)",
        boxShadow: active
          ? `4px 4px 0 rgba(11,15,25,0.85), 0 1px 3px rgba(11,15,25,0.07)`
          : "0 1px 3px rgba(11,15,25,0.07), 0 14px 34px rgba(11,15,25,0.09)",
        willChange: "width",
        backfaceVisibility: "hidden",
      }}
      onMouseEnter={onActivate}
      onClick={onActivate}
      onFocus={onActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate();
        }
      }}
      tabIndex={0}
      aria-label={`${project.title}, project ${index + 1} of ${projects.length}`}
      aria-expanded={active}
    >
      {/* collapsed rail */}
      <div
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between py-4 transition-opacity duration-300"
        style={{ opacity: active ? 0 : 1 }}
        aria-hidden={active}
      >
        <span className="font-mono text-[10px] font-bold" style={{ color: project.color }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <span
          className="whitespace-nowrap font-mono text-[11px] font-bold tracking-[0.2em] text-[#4A5261] transition-colors duration-300 group-hover:text-[#0B0F19]"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          {project.title.toUpperCase()}
        </span>
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: project.color, boxShadow: `0 0 8px ${project.color}` }}
        />
      </div>

      {/* expanded flash card */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: active ? 1 : 0,
          transitionDelay: active ? "180ms" : "0ms",
          pointerEvents: active ? "auto" : "none",
        }}
        aria-hidden={!active}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${project.color}0A 0%, transparent 50%, ${project.color}05 100%)`,
          }}
        />
        <div className="absolute inset-0 cyber-scanlines pointer-events-none opacity-50" />
        <span className="absolute top-2 left-2 w-4 h-4 border-t border-l" style={{ borderColor: `${project.color}80` }} />
        <span className="absolute top-2 right-2 w-4 h-4 border-t border-r" style={{ borderColor: `${project.color}80` }} />
        <span className="absolute bottom-2 left-2 w-4 h-4 border-b border-l" style={{ borderColor: `${project.color}80` }} />
        <span className="absolute bottom-2 right-2 w-4 h-4 border-b border-r" style={{ borderColor: `${project.color}80` }} />

        <div className="relative flex h-full flex-col p-5 md:p-7">
          <div className="mb-5 flex items-center justify-between">
            <span style={{ color: project.color }}>
              <ProjectIcon name={project.icon} />
            </span>
            <div className="flex items-center gap-2 font-mono text-[10px]" style={{ color: project.color }}>
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: project.color, boxShadow: `0 0 6px ${project.color}` }}
              />
              LIVE
            </div>
          </div>

          <div>
            <span className="font-mono text-xs tracking-widest" style={{ color: project.color }}>
              {String(index + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")} :: MODULE
            </span>
            <h3 className="mt-2 text-2xl font-mono font-bold leading-tight text-[#0B0F19]">
              {project.title}
            </h3>
          </div>

          <p className="mt-4 font-mono text-sm leading-relaxed text-[#4A5261]">
            {project.description}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 font-mono text-xs border rounded-sm"
                style={{
                  borderColor: `${project.color}40`,
                  color: project.color,
                  backgroundColor: `${project.color}0A`,
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-auto flex gap-3">
            <button
              className="relative px-4 py-2 font-mono text-xs font-bold rounded-sm transition-transform hover:scale-105"
              style={{
                backgroundColor: `${project.color}15`,
                color: project.color,
                border: `1px solid ${project.color}50`,
              }}
            >
              DEPLOY
            </button>
            {project.href ? (
              <a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 font-mono text-xs rounded-sm border border-black/15 text-[#4A5261] hover:text-[#0B0F19] hover:border-black/30 transition-all"
              >
                SOURCE ↗
              </a>
            ) : (
              <button className="px-4 py-2 font-mono text-xs rounded-sm border border-black/15 text-[#4A5261] hover:text-[#0B0F19] hover:border-black/30 transition-all">
                SOURCE
              </button>
            )}
          </div>
        </div>

        <div
          className="absolute bottom-0 left-0 h-[2px] w-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${project.color}, transparent)`,
            opacity: 0.6,
          }}
        />
      </div>
    </div>
  );
}

export function ProjectsSection() {
  const { ref: inViewRef, inView } = useInView<HTMLElement>();
  const [active, setActive] = useState(0);

  return (
    <section ref={inViewRef} className="relative overflow-hidden bg-[#F2F4F3]">
      <div className="absolute inset-0 cyber-grid-bg opacity-20 pointer-events-none z-0" />

      <div className="absolute inset-0 z-0">
        {inView && (
          <Canvas
            camera={{ position: [0, 0, 8], fov: 35 }}
            style={{ width: "100%", height: "100%" }}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            dpr={[1, 2]}
            onCreated={({ gl }) => gl.setClearColor(0xF2F4F3, 0)}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 7]} intensity={0.5} color="#FF4500" />
            <directionalLight position={[-5, 5, -5]} intensity={0.3} color="#2249C7" />
            <BackgroundParticles count={80} spread={15} />
          </Canvas>
        )}
      </div>

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-[#FF4500] tracking-widest">[02]</span>
              <span className="h-px flex-1 max-w-[60px] bg-[#FF4500]/30" />
              <span className="font-mono text-xs text-[#FF4500] tracking-widest uppercase">Selected Work</span>
            </div>
            <h2 className="mt-4 font-mono text-3xl md:text-5xl font-bold tracking-tight text-[#0B0F19]">
              Deployed <span className="text-[#2249C7]">Models</span>
            </h2>
            <p className="mt-4 text-[#4A5261] max-w-2xl font-mono text-sm">
              Production ML systems — from real-time vision inference to large-scale retrieval pipelines.
            </p>
          </motion.div>
        </div>

        {/* flash card thinstrips */}
        <div className="mt-12 overflow-x-auto px-6 pb-4 md:mt-16">
          <div className="mx-auto flex w-max gap-3">
            {projects.map((project, i) => (
              <Thinstrip
                key={project.id}
                project={project}
                index={i}
                active={active === i}
                onActivate={() => setActive(i)}
              />
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-4 mb-16">
          <div className="flex items-center gap-3 font-mono text-xs tracking-widest text-[#767E8C]">
            <span className="text-[#FF4500]">
              STRIP {String(active + 1).padStart(2, "0")}/{String(projects.length).padStart(2, "0")}
            </span>
            <span className="h-px flex-1 max-w-[120px] bg-black/10" />
            <span>HOVER_OR_TAB_A_STRIP_TO_EXPAND →</span>
          </div>
        </div>
      </div>
    </section>
  );
}
