export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { type: "spring", stiffness: 350, damping: 35 },
  },
  slideUp: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring", stiffness: 350, damping: 35 },
  },
  slideInLeft: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    transition: { type: "spring", stiffness: 350, damping: 35 },
  },
  slideInRight: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    transition: { type: "spring", stiffness: 350, damping: 35 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: "spring", stiffness: 350, damping: 35 },
  },
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring", stiffness: 350, damping: 35 },
  },
};

export const easings = {
  smooth: [0.25, 0.46, 0.45, 0.94],
  snappy: [0.4, 0, 0.2, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  easeOut: [0.25, 0.46, 0.45, 0.94],
};

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

export const colors = {
  background: "#F2F4F3",
  surface: "#FFFFFF",
  surfaceHover: "#E4E7E6",
  border: "rgba(11,15,25,0.15)",
  text: "#0B0F19",
  textMuted: "#4A5261",
  textDim: "#767E8C",
  neural: "#FF4500",
  mint: "#0E7A56",
  tensor: "#2249C7",
  amber: "#B45309",
  primary: "#FF4500",
  primaryDark: "#C43C00",
  primaryLight: "#FF7A45",
};

export const gradients = {
  primary: "linear-gradient(135deg, #FF4500 0%, #0E7A56 100%)",
  primaryReverse: "linear-gradient(135deg, #0E7A56 0%, #FF4500 100%)",
  dark: "linear-gradient(180deg, #F2F4F3 0%, #FFFFFF 100%)",
  card: "linear-gradient(135deg, rgba(255,69,0,0.05) 0%, rgba(34,73,199,0.05) 100%)",
  mesh: "radial-gradient(ellipse at center, rgba(255,69,0,0.1) 0%, transparent 70%)",
  neon: "linear-gradient(90deg, #FF4500, #2249C7, #0E7A56)",
};

export const shadows = {
  glow: "0 0 30px rgba(255,69,0,0.18)",
  glowSm: "0 0 15px rgba(255,69,0,0.15)",
  glowLg: "0 0 60px rgba(255,69,0,0.28)",
  glowMint: "0 0 30px rgba(14,122,86,0.3)",
  glowPurple: "0 0 30px rgba(34,73,199,0.22)",
  glowAmber: "0 0 30px rgba(180,83,9,0.22)",
  card: "0 1px 3px rgba(11,15,25,0.07), 0 14px 34px rgba(11,15,25,0.09)",
  cardHover: "0 8px 48px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255,69,0,0.1)",
};

export const zIndices = {
  canvas: -1,
  content: 10,
  navigation: 40,
  progress: 50,
  modal: 100,
  tooltip: 200,
};