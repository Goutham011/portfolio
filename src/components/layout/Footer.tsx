"use client";

import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-black/15 bg-[#F2F4F3]">
      <div className="absolute inset-0 cyber-grid-bg opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 py-12 relative">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="#home" className="flex items-center gap-2.5 mb-4 group">
              <span className="relative flex items-center justify-center w-8 h-8 border border-[#FF4500]/60 rounded-sm">
                <span className="w-2 h-2 bg-[#FF4500] cyber-blink" />
                <span className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-[#FF4500]" />
                <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-[#FF4500]" />
              </span>
              <span className="font-mono text-sm font-bold tracking-widest text-[#0B0F19] group-hover:text-[#FF4500] transition-colors">
                GOUTHAM.SAI
              </span>
            </Link>
            <p className="text-[#4A5261] max-w-sm leading-relaxed font-mono text-sm">
              Data Management Analyst building governed pipelines, quality
              frameworks, and ETL architectures with Python, SQL, BigQuery and Airflow.
            </p>
            <div className="mt-6 flex gap-3">
              {[
                { href: "https://github.com/Goutham011", label: "GitHub", color: "#FF4500", icon: (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                )},
                { href: "https://linkedin.com/in/GouthamSai", label: "LinkedIn", color: "#2249C7", icon: (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z"/></svg>
                )},
                { href: "mailto:gouthamsaigoparaju@gmail.com", label: "Email", color: "#0E7A56", icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                )},
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 text-[#767E8C] border border-black/15 rounded-sm hover:border-black/25 transition-all"
                  style={{ willChange: "color, border-color", backfaceVisibility: "hidden" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = social.color; e.currentTarget.style.borderColor = social.color; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = ""; e.currentTarget.style.borderColor = ""; }}
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-mono text-xs font-bold text-[#FF4500] mb-4 tracking-widest">NAVIGATE</h4>
            <nav className="space-y-3">
              {[
                { href: "#home", label: "Home" },
                { href: "#work", label: "Work" },
                { href: "#about", label: "About" },
                { href: "#cnn", label: "Pipeline" },
                { href: "#terminal", label: "Skills" },
                { href: "#cv", label: "CV Lab" },
                { href: "#contact", label: "Contact" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-[#4A5261] hover:text-[#FF4500] transition-colors text-sm font-mono"
                >
                  <span className="text-[#FF4500]/40 mr-2">→</span>{link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Stack */}
          <div>
            <h4 className="font-mono text-xs font-bold text-[#FF4500] mb-4 tracking-widest">STACK</h4>
            <div className="flex flex-wrap gap-2">
              {["Python", "SQL", "Apache Spark", "Kafka", "Airflow", "BigQuery", "MongoDB", "Power BI", "Docker"].map((tech, i) => {
                const palette = ["#FF4500", "#2249C7", "#0E7A56", "#B45309"];
                const color = palette[i % palette.length];
                return (
                  <span
                    key={tech}
                    className="px-2 py-1 text-[10px] font-mono rounded-sm border"
                    style={{
                      borderColor: `${color}33`,
                      color: color,
                      backgroundColor: `${color}0A`,
                    }}
                  >
                    {tech}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-black/15 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#767E8C] text-xs font-mono">
            © {currentYear} GOUTHAM SAI — ALL SYSTEMS NOMINAL
          </p>
          <div className="flex items-center gap-4 text-xs font-mono text-[#767E8C]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0E7A56] cyber-blink" />
              STATUS: ONLINE
            </span>
            <span>v2.1.0</span>
            <Link href="#contact" className="hover:text-[#FF4500] transition-colors">
              INIT_LINK →
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
