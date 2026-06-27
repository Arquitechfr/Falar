export const animations = {
  springSoft: { damping: 18, stiffness: 120, mass: 1 },
  springSnappy: { damping: 15, stiffness: 300, mass: 0.8 },
  springBouncy: { damping: 12, stiffness: 200, mass: 0.6 },
  timingFast: { duration: 150 },
  timingNormal: { duration: 250 },
  timingSlow: { duration: 400 },
} as const;

export type Animations = typeof animations;
