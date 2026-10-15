"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";

const navItems = [
  { href: "#home", label: "HOME" },
  { href: "#work", label: "WORK" },
  { href: "#about", label: "ABOUT" },
  { href: "#cnn", label: "PIPELINE" },
  { href: "#terminal", label: "SKILLS" },
  { href: "#cv", label: "CV" },
  { href: "#contact", label: "CONTACT" },
];

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();
  const progress = useTransform(scrollY, [0, 100], [0, 1]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileOpen(false);
    }
  };

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 h-[2px] z-50 origin-left"
        style={{
          transformOrigin: "left center",
          scaleX: progress,
          background: "#FF4500",
          willChange: "transform",
          backfaceVisibility: "hidden",
        }}
      />

      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-white border-b border-black/15"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="#home"
            onClick={(e) => { e.preventDefault(); scrollTo("#home"); }}
            className="flex items-center gap-2.5 group"
          >
            <span className="relative flex items-center justify-center w-8 h-8 border border-[#FF4500]/60 rounded-sm">
              <span className="w-2 h-2 bg-[#FF4500] cyber-blink" />
              <span className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-[#FF4500]" />
              <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-[#FF4500]" />
            </span>
            <span className="hidden sm:block font-mono text-sm font-bold tracking-widest text-[#0B0F19] group-hover:text-[#FF4500] transition-colors">
              GOUTHAM.SAI
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => { e.preventDefault(); scrollTo(item.href); }}
                className="relative px-4 py-2 font-mono text-xs tracking-widest text-[#4A5261] hover:text-[#FF4500] transition-colors group"
              >
                <span className="text-[#FF4500]/40 mr-1 hidden lg:inline">{`0${i + 1}`}</span>
                {item.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-0 group-hover:w-full bg-[#FF4500] transition-all duration-300" />
              </Link>
            ))}
          </div>

          <div className="hidden md:block">
            <Link
              href="#contact"
              onClick={(e) => { e.preventDefault(); scrollTo("#contact"); }}
              className="relative px-5 py-2 font-mono text-xs font-bold tracking-widest bg-[#FF4500] text-[#0B0F19] border border-[#0B0F19] rounded-sm hover:-translate-y-px hover:shadow-[3px_3px_0_#0B0F19] transition-all"
            >
              <span className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t border-l border-[#0B0F19]" />
              <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 border-b border-r border-[#0B0F19]" />
              INIT_LINK
            </Link>
          </div>

          <button
            className="md:hidden p-2 text-[#4A5261] hover:text-[#FF4500] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        <motion.div
          className="md:hidden overflow-hidden bg-white border-t border-black/15"
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: mobileOpen ? 1 : 0, opacity: mobileOpen ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 35 }}
          style={{ transformOrigin: "top center", willChange: "transform", backfaceVisibility: "hidden" }}
        >
          <div className="px-6 py-6 space-y-2">
            {navItems.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => { e.preventDefault(); scrollTo(item.href); }}
                className="flex items-center gap-3 px-4 py-3 font-mono text-sm tracking-widest text-[#4A5261] hover:text-[#FF4500] rounded-sm transition-colors hover:bg-[#FF4500]/5 border border-transparent hover:border-[#FF4500]/20"
              >
                <span className="text-[#FF4500]/40 text-xs">{`0${i + 1}`}</span>
                {item.label}
              </Link>
            ))}
            <Link
              href="#contact"
              onClick={(e) => { e.preventDefault(); scrollTo("#contact"); }}
              className="block w-full text-center px-5 py-3 mt-4 font-mono text-xs font-bold tracking-widest bg-[#FF4500] text-[#0B0F19] border border-[#0B0F19] rounded-sm shadow-[3px_3px_0_#0B0F19]"
            >
              INIT_LINK
            </Link>
          </div>
        </motion.div>
      </nav>
    </>
  );
}
