"use client";

import { useEffect, useRef, useState } from "react";

export function useInView<T extends HTMLElement>(threshold = 0.1) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

export function useThrottledCallback<A extends unknown[], R>(
  callback: (...args: A) => R,
  delay = 16
) {
  const lastCall = useRef(0);
  const rafId = useRef<number>(0);

  return (...args: A) => {
    const now = performance.now();
    const elapsed = now - lastCall.current;

    if (elapsed >= delay) {
      lastCall.current = now;
      callback(...args);
    } else {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        lastCall.current = performance.now();
        callback(...args);
      });
    }
  };
}