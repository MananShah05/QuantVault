"use client";

import { useState } from "react";
import { PortfolioListItem } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Trash2, ArrowRight } from "lucide-react";
import { useDeletePortfolio } from "@/hooks/usePortfolio";
import { MOTION } from "@/lib/motion";

function generateSparklinePoints(id: string, annReturn: number | null | undefined, volatility: number | null | undefined): string {
  const pointsCount = 30;
  const ret = annReturn ?? 0.08;
  const vol = volatility ?? 0.12;
  
  // Seed hash based on ID
  let seed = 0;
  for (let i = 0; i < id.length; i++) {
    seed += id.charCodeAt(i);
  }
  
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
  
  const values: number[] = [0];
  let current = 0;
  for (let i = 1; i < pointsCount; i++) {
    // Generate pseudo random-walk path
    const step = (random() - 0.5) * vol * 0.35 + (ret / pointsCount);
    current += step;
    values.push(current);
  }
  
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;
  
  const width = 340;
  const height = 50;
  const padding = 4;
  
  const points = values.map((val, index) => {
    const x = (index / (pointsCount - 1)) * width;
    const y = height - padding - ((val - minVal) / range) * (height - 2 * padding);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  
  return points;
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export function PortfolioCard({ portfolio }: { portfolio: PortfolioListItem }) {
  const { mutate: deletePortfolio } = useDeletePortfolio();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleFormatPct = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "N/A";
    const sign = val >= 0 ? "+" : "";
    return `${sign}${(val * 100).toFixed(1)}%`;
  };

  const handleFormatVal = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "N/A";
    return `${(val * 100).toFixed(1)}%`;
  };

  const snapshot = portfolio.latest_snapshot;
  
  const getReturnColor = (val: number | null | undefined) => 
    val && val >= 0 ? "text-positive" : "text-negative";

  const getVolColor = (val: number | null | undefined) => 
    val && val < 0.15 ? "text-positive" : (val && val < 0.25 ? "text-warning" : "text-negative");

  const getSharpeColor = (val: number | null | undefined) => 
    val && val > 1 ? "text-positive" : (val && val > 0.5 ? "text-warning" : "text-negative");

  const sparklinePoints = generateSparklinePoints(
    portfolio.id, 
    snapshot?.annualized_return, 
    snapshot?.portfolio_volatility
  );

  return (
    <motion.div 
      variants={MOTION.itemUp}
      whileHover={MOTION.cardHover}
      className="bg-surface border border-subtle rounded-lg overflow-hidden flex flex-col justify-between h-full select-none hover:border-strong transition-colors duration-200"
    >
      <div className="p-5 space-y-4">
        {/* Card Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-sans text-[16px] font-semibold text-[var(--text-primary)] leading-tight">
              {portfolio.name}
            </h3>
            <div className="mt-2.5 flex flex-wrap gap-1">
              {portfolio.assets.map(a => (
                <span 
                  key={a.ticker} 
                  className="bg-elevated border border-subtle rounded px-2 py-0.5 font-mono text-[11px] text-[var(--text-primary)]"
                >
                  {a.ticker}
                </span>
              ))}
            </div>
          </div>
          
          <button 
            onClick={() => setShowConfirm(true)}
            className="p-1 text-[var(--text-muted)] hover:text-negative hover:bg-[var(--negative-dim)] rounded transition-colors shrink-0"
            title="Delete Portfolio"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Separator */}
        <div className="h-[1px] bg-subtle" />

        {/* Metrics Rows */}
        <div className="grid grid-cols-4 gap-2">
          <div className="flex flex-col">
            <span className="font-sans text-[9px] font-medium text-[var(--text-muted)] uppercase tracking-wider">RETURN</span>
            <span className={`font-mono text-[14px] font-semibold mt-1 ${getReturnColor(snapshot?.annualized_return)}`}>
              {handleFormatPct(snapshot?.annualized_return)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-[9px] font-medium text-[var(--text-muted)] uppercase tracking-wider">VOLATILITY</span>
            <span className={`font-mono text-[14px] font-semibold mt-1 ${getVolColor(snapshot?.portfolio_volatility)}`}>
              {handleFormatVal(snapshot?.portfolio_volatility)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-[9px] font-medium text-[var(--text-muted)] uppercase tracking-wider">SHARPE</span>
            <span className={`font-mono text-[14px] font-semibold mt-1 ${getSharpeColor(snapshot?.sharpe_ratio)}`}>
              {snapshot?.sharpe_ratio?.toFixed(2) ?? "N/A"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-[9px] font-medium text-[var(--text-muted)] uppercase tracking-wider">MAX DD</span>
            <span className="font-mono text-[14px] font-semibold text-negative mt-1">
              {handleFormatVal(snapshot?.max_drawdown)}
            </span>
          </div>
        </div>
        
        {/* Separator */}
        <div className="h-[1px] bg-subtle" />

        {/* Pure SVG Sparkline */}
        <div className="h-[60px] w-full flex items-center justify-center bg-[var(--bg-base)]/30 border border-subtle border-dashed rounded px-1">
          {snapshot?.annualized_return !== null ? (
            <svg className="w-full h-[50px]" viewBox="0 0 340 50">
              <polyline
                fill="none"
                stroke="var(--series-1)"
                strokeWidth="1"
                points={sparklinePoints}
              />
            </svg>
          ) : (
            <span className="font-mono text-[10px] text-[var(--text-muted)]">PENDING CALCULATION</span>
          )}
        </div>
      </div>

      {/* Footer Info / Link */}
      <div className="px-5 py-3 border-t border-subtle bg-base bg-opacity-30 flex justify-between items-center">
        <span className="font-mono text-[11px] text-[var(--text-muted)]">
          {portfolio.last_computed ? `Updated ${formatTimeAgo(portfolio.last_computed)}` : "Never computed"}
        </span>
        
        <Link href={`/portfolio/${portfolio.id}`} className="inline-flex items-center gap-1 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium font-sans">
          Analyze <ArrowRight size={14} />
        </Link>
      </div>

      {/* Delete Confirmation Strip */}
      <AnimatePresence initial={false}>
        {showConfirm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[var(--negative-dim)] border-t border-[var(--negative-dim)] px-5 py-3.5 flex items-center justify-between text-xs text-negative"
          >
            <span className="font-sans">Delete &quot;{portfolio.name}&quot;?</span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-2.5 py-1 rounded bg-[var(--bg-elevated)] border border-default text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deletePortfolio(portfolio.id);
                  setShowConfirm(false);
                }}
                className="px-2.5 py-1 rounded bg-negative text-white hover:bg-[#ef4444] transition-colors font-medium"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
