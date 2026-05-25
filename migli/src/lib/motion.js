// MIGLI · Motion design library
// All easings and variants live here so motion stays consistent across the app

// Cinematic easing curves — borrowed from premium design references
export const EASE = {
  // Apple-style sleek easing
  sleek: [0.16, 1, 0.3, 1],
  // Soft cinematic enter
  cinema: [0.25, 0.1, 0.25, 1],
  // Quick snappy
  snap: [0.4, 0, 0.2, 1],
}

// Stagger container with children fade-up
export const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

// Standard fade-up child
export const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE.sleek },
  },
}

// Slow cinematic reveal — for big hero text
export const cinemaReveal = {
  hidden: { opacity: 0, y: 50, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 1.2, ease: EASE.cinema },
  },
}

// Scale-in fade — for cards
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.7, ease: EASE.sleek },
  },
}

// Float — for hovering UI
export const floatY = {
  initial: { y: 0 },
  animate: {
    y: [0, -8, 0],
    transition: { duration: 4, ease: 'easeInOut', repeat: Infinity },
  },
}

// Hover lift used on feature cards
export const hoverLift = {
  whileHover: {
    y: -4,
    transition: { duration: 0.3, ease: EASE.sleek },
  },
}

// Magnetic button — used by buttons & nav cta
export const magneticTap = {
  whileTap: { scale: 0.97 },
  whileHover: { scale: 1.02, y: -2 },
}
