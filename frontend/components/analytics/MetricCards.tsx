"use client";

import { SnapshotResponse } from "@/types";
import { motion } from "framer-motion";
import { TrendingUp, Activity, ShieldAlert, Award } from "lucide-react";
import { MOTION } from "@/lib/motion";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

export function MetricCards({ snapshot }: { snapshot: SnapshotResponse }) {
  const getReturnColor = (val: number | null | undefined) => 
    val && val >= 0 ? "text-positive" : "text-negative";

  const getVolColor = (val: number | null | undefined) => 
    val && val < 0.15 ? "text-positive" : (val && val < 0.25 ? "text-warning" : "text-negative");

  const getSharpeColor = (val: number | null | undefined) => 
    val && val > 1 ? "text-positive" : (val && val > 0.5 ? "text-warning" : "text-negative");

  const returnColor = getReturnColor(snapshot.annualized_return);
  const volColor = getVolColor(snapshot.portfolio_volatility);
  const sharpeColor = getSharpeColor(snapshot.sharpe_ratio);

  // Signed percent: "+12.34%" / "-4.50%"
  const fmtSignedPct = (v: number) => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(2)}%`;
  // Unsigned percent: "12.34%"
  const fmtPct = (v: number) => `${(v * 100).toFixed(2)}%`;
  const fmtNum = (v: number) => v.toFixed(2);

  const cards = [
    { 
      title: "Annualised Return", 
      raw: snapshot.annualized_return,
      formatter: fmtSignedPct,
      colorClass: returnColor,
      borderStyle: snapshot.annualized_return && snapshot.annualized_return >= 0 ? "border-l-positive" : "border-l-negative",
      icon: TrendingUp,
      sub: "annualized target rate",
      progress: Math.min(100, Math.max(0, (snapshot.annualized_return || 0) * 100))
    },
    { 
      title: "Portfolio Volatility", 
      raw: snapshot.portfolio_volatility,
      formatter: fmtPct,
      colorClass: volColor,
      borderStyle: snapshot.portfolio_volatility && snapshot.portfolio_volatility < 0.15 
        ? "border-l-positive" 
        : (snapshot.portfolio_volatility && snapshot.portfolio_volatility < 0.25 ? "border-l-warning" : "border-l-negative"),
      icon: Activity,
      sub: "rolling 30d annualized",
      progress: Math.min(100, Math.max(0, (snapshot.portfolio_volatility || 0) * 100))
    },
    { 
      title: "Max Drawdown", 
      raw: snapshot.max_drawdown,
      formatter: fmtPct,
      colorClass: "text-negative",
      borderStyle: "border-l-negative",
      icon: ShieldAlert,
      sub: "historical peak loss",
      progress: Math.min(100, Math.max(0, Math.abs(snapshot.max_drawdown || 0) * 100))
    },
    { 
      title: "Sharpe Ratio", 
      raw: snapshot.sharpe_ratio,
      formatter: fmtNum,
      colorClass: sharpeColor,
      borderStyle: snapshot.sharpe_ratio && snapshot.sharpe_ratio > 1 
        ? "border-l-positive" 
        : (snapshot.sharpe_ratio && snapshot.sharpe_ratio > 0.5 ? "border-l-warning" : "border-l-negative"),
      icon: Award,
      sub: "risk-adjusted return",
      progress: Math.min(100, Math.max(0, (snapshot.sharpe_ratio || 0) * 33)) // Normalizing 3.0 Sharpe as 100%
    },
  ];

  return (
    <motion.div 
      variants={MOTION.pageContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        const hasValue = card.raw !== null && card.raw !== undefined;
        return (
          <motion.div 
            key={card.title} 
            variants={MOTION.itemUp}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={`group bg-surface elev-1 border-t border-r border-b border-subtle border-l-[3px] ${card.borderStyle} p-5 flex flex-col justify-between min-h-[140px] transition-colors hover:border-accent-border`}
          >
            <div className="flex justify-between items-start">
              <span className="font-sans text-[10px] font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase">
                {card.title}
              </span>
              <Icon size={12} className="text-[var(--text-muted)] transition-colors group-hover:text-accent" />
            </div>

            <div className="mt-3">
              <span className={`font-mono text-3xl font-semibold tabular-nums ${card.colorClass}`}>
                {hasValue
                  ? <AnimatedNumber value={card.raw as number} formatter={card.formatter} />
                  : "N/A"}
              </span>
            </div>

            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <span className="text-[11px] font-sans">{card.sub}</span>
              </div>
              <div className="w-full h-[3px] bg-elevated rounded-none overflow-hidden">
                <motion.div 
                  className="h-full bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${card.progress}%` }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
