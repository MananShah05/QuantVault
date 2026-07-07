// Easing curves — no springs, no overshoot. This is an instrument, not a toy.
export const EASE = {
  // Expo-out: decisive, fast-in then settle. Primary entrance/exit curve.
  expo: [0.16, 1, 0.3, 1] as const,
  // Standard ease-out for charts / heavy elements.
  out: [0.22, 1, 0.36, 1] as const,
  // Symmetric for hover/state micro-interactions.
  inOut: [0.45, 0, 0.55, 1] as const,
};

export const MOTION = {
  // Page entrance — staggered children
  pageContainer: {
    hidden: {},
    show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } }
  },

  // Item entrance — up fade (for cards, rows, stat items)
  itemUp: {
    hidden: { opacity: 0, y: 14 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE.expo } }
  },

  // Item entrance — fade only (for charts, heavy elements)
  itemFade: {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { duration: 0.45, ease: EASE.out } }
  },

  // Sidebar collapse — expo tween, no spring wobble
  sidebarExpand: {
    open:   { width: 220, transition: { duration: 0.42, ease: EASE.expo } },
    closed: { width: 64,  transition: { duration: 0.42, ease: EASE.expo } }
  },

  // Active nav indicator slide — tween, no spring
  navIndicator: {
    layoutId: "nav-indicator",
    transition: { duration: 0.35, ease: EASE.expo }
  },

  // Stat card number counter (via motion value animation)
  counter: { duration: 1.1, ease: EASE.expo },

  // Chart panel reveal (delay for after stat cards)
  chartReveal: {
    hidden: { opacity: 0, y: 10 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE.out, delay: 0.3 } }
  },

  // Hover states — applied via whileHover
  cardHover: { scale: 1.005, transition: { duration: 0.18, ease: EASE.out } },
  buttonHover: { scale: 1.02, transition: { duration: 0.12, ease: EASE.out } },
  buttonTap: { scale: 0.97 },

  // Toast / notification slide in
  toastIn: {
    initial: { opacity: 0, x: 40, scale: 0.98 },
    animate: { opacity: 1, x: 0,  scale: 1,   transition: { duration: 0.32, ease: EASE.expo } },
    exit:    { opacity: 0, x: 40, scale: 0.98, transition: { duration: 0.2, ease: EASE.inOut } }
  },

  // Loading shimmer — CSS only, not Framer
  shimmer: "shimmer 1.6s ease-in-out infinite"
};
