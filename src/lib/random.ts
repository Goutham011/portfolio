/**
 * Deterministic hash-based pseudo-random in [0, 1).
 * Used instead of Math.random() inside render/useMemo so component
 * output is idempotent (react-hooks/purity).
 */
export function hash01(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
