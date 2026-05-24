export const MOTION = {
  // Page entrance — staggered children
  pageContainer: {
    hidden: {},
    show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } }
  },

  // Item entrance — up fade (for cards, rows, stat items)
  itemUp: {
    hidden: { opacity: 0, y: 14 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } }
  },

  // Item entrance — fade only (for charts, heavy elements)
  itemFade: {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { duration: 0.45, ease: "easeOut" } }
  },

  // Sidebar collapse spring
  sidebarExpand: {
    open:   { width: 220, transition: { type: "spring", stiffness: 380, damping: 38 } },
    closed: { width: 64,  transition: { type: "spring", stiffness: 380, damping: 38 } }
  },

  // Active nav indicator slide
  navIndicator: {
    layoutId: "nav-indicator",
    transition: { type: "spring", stiffness: 420, damping: 36 }
  },

  // Stat card number counter (via motion value animation)
  counter: { duration: 1.2, ease: [0.25, 0.1, 0.25, 1] },

  // Chart panel reveal (delay for after stat cards)
  chartReveal: {
    hidden: { opacity: 0, y: 10 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut", delay: 0.3 } }
  },

  // Hover states — applied via whileHover
  cardHover: { scale: 1.005, transition: { duration: 0.15 } },
  buttonHover: { scale: 1.02, transition: { duration: 0.1 } },
  buttonTap: { scale: 0.97 },

  // Toast / notification slide in
  toastIn: {
    initial: { opacity: 0, x: 40, scale: 0.95 },
    animate: { opacity: 1, x: 0,  scale: 1,   transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
    exit:    { opacity: 0, x: 40, scale: 0.95, transition: { duration: 0.2 } }
  },

  // Loading shimmer — CSS only, not Framer
  shimmer: "shimmer 1.6s ease-in-out infinite"
};
