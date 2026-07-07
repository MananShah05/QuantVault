"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { EASE } from "@/lib/motion";

interface AnimatedNumberProps {
  value: number;
  /** Formats the live tweened value into display text. */
  formatter?: (v: number) => string;
  /** Tween duration in seconds. */
  duration?: number;
  className?: string;
}

/**
 * Counts up / ticks to `value` on mount and re-animates from the current
 * displayed value whenever `value` changes (e.g. on data refresh).
 * Uses the expo-out curve — decisive settle, no overshoot.
 */
export function AnimatedNumber({
  value,
  formatter = (v) => v.toFixed(2),
  duration = 1.1,
  className,
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const text = useTransform(motionValue, (latest) => formatter(latest));

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: EASE.expo,
    });
    return () => controls.stop();
  }, [motionValue, value, duration]);

  return <motion.span className={className}>{text}</motion.span>;
}
