"use client";

import { SnapshotResponse } from "@/types";
import { motion } from "framer-motion";
import { TrendingUp, Activity, ShieldAlert, Award } from "lucide-react";
import { MOTION } from "@/lib/motion";

export function MetricCards({ snapshot }: { snapshot: SnapshotResponse }) {
  const handleFormatPct = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "N/A";
    const sign = val >= 0 ? "+" : "";
    return `${sign}${(val * 100).toFixed(2)}%`;
  };

  const handleFormatVal = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "N/A";
    return `${(val * 100).toFixed(2)}%`;
  };

  const getReturnColor = (val: number | null | undefined) => 
    val && val >= 0 ? "text-positive" : "text-negative";

  const getVolColor = (val: number | null | undefined) => 
    val && val < 0.15 ? "text-positive" : (val && val < 0.25 ? "text-warning" : "text-negative");

  const getSharpeColor = (val: number | null | undefined) => 
    val && val > 1 ? "text-positive" : (val && val > 0.5 ? "text-warning" : "text-negative");

  const returnColor = getReturnColor(snapshot.annualized_return);
  const volColor = getVolColor(snapshot.portfolio_volatility);
  const sharpeColor = getSharpeColor(snapshot.sharpe_ratio);

  const cards = [
    { 
      title: "Annualised Return", 
      value: handleFormatPct(snapshot.annualized_return), 
      colorClass: returnColor,
      borderStyle: snapshot.annualized_return && snapshot.annualized_return >= 0 ? "border-l-positive" : "border-l-negative",
      icon: TrendingUp,
      sub: "annualized target rate",
      progress: Math.min(100, Math.max(0, (snapshot.annualized_return || 0) * 100))
    },
    { 
      title: "Portfolio Volatility", 
      value: handleFormatVal(snapshot.portfolio_volatility), 
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
      value: handleFormatVal(snapshot.max_drawdown), 
      colorClass: "text-negative",
      borderStyle: "border-l-negative",
      icon: ShieldAlert,
      sub: "historical peak loss",
      progress: Math.min(100, Math.max(0, Math.abs(snapshot.max_drawdown || 0) * 100))
    },
    { 
      title: "Sharpe Ratio", 
      value: snapshot.sharpe_ratio?.toFixed(2) ?? "N/A", 
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
        return (
          <motion.div 
            key={card.title} 
            variants={MOTION.itemUp}
            className={`bg-surface border-t border-r border-b border-subtle border-l-[3px] ${card.borderStyle} p-5 flex flex-col justify-between min-h-[140px]`}
          >
            <div className="flex justify-between items-start">
              <span className="font-sans text-[10px] font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase">
                {card.title}
              </span>
              <Icon size={12} className="text-[var(--text-muted)]" />
            </div>

            <div className="mt-3">
              <span className={`font-mono text-3xl font-semibold ${card.colorClass}`}>
                {card.value}
              </span>
            </div>

            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <span className="text-[11px] font-sans">{card.sub}</span>
              </div>
              <div className="w-full h-[3px] bg-elevated rounded-none overflow-hidden">
                <div 
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${card.progress}%` }}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
