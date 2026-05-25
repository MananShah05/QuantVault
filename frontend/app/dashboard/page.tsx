"use client";

import { useMemo, useEffect } from "react";
import Link from "next/link";
import { Loader2, Plus } from "lucide-react";
import { usePortfolios } from "@/hooks/usePortfolio";
import { PortfolioListItem } from "@/types";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { MOTION } from "@/lib/motion";
import { PortfolioList } from "@/components/dashboard/PortfolioList";

function AnimatedNumber({ 
  value, 
  formatter = (v: number) => v.toFixed(2) 
}: { 
  value: number; 
  formatter?: (v: number) => string;
}) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => formatter(latest));

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 1.2,
      ease: [0.25, 0.1, 0.25, 1],
    });
    return () => controls.stop();
  }, [motionValue, value]);

  return <motion.span>{rounded}</motion.span>;
}

function average(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => value !== null && value !== undefined);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}

function DashboardSummary({ portfolios }: { portfolios: PortfolioListItem[] }) {
  const aggregates = useMemo(() => {
    const snapshots = portfolios.map((portfolio) => portfolio.latest_snapshot).filter(Boolean);
    const avgSharpe = average(snapshots.map((snapshot) => snapshot?.sharpe_ratio));
    const avgVolatility = average(snapshots.map((snapshot) => snapshot?.portfolio_volatility));
    
    // total exposure is the average of sum of asset weights across all portfolios
    const totalExposure = portfolios.length
      ? portfolios.reduce((sum, portfolio) => sum + portfolio.assets.reduce((assetSum, asset) => assetSum + asset.weight, 0), 0) / portfolios.length
      : 0;
      
    const computedCount = portfolios.filter((portfolio) => portfolio.status === "ready" && portfolio.latest_snapshot).length;
    const pendingCount = portfolios.filter((portfolio) => portfolio.status !== "ready").length;
    return { avgSharpe, avgVolatility, totalExposure, computedCount, pendingCount };
  }, [portfolios]);

  const avgVolatility = aggregates.avgVolatility ?? 0;
  const riskState =
    aggregates.avgVolatility === null
      ? "PENDING"
      : avgVolatility < 0.15
        ? "CONTROLLED"
        : avgVolatility < 0.25
          ? "ELEVATED"
          : "HIGH";

  const riskColor = 
    riskState === "CONTROLLED" 
      ? "text-positive" 
      : riskState === "ELEVATED" 
        ? "text-warning" 
        : "text-negative";

  const sharpeColor =
    aggregates.avgSharpe === null
      ? "text-[var(--text-primary)]"
      : aggregates.avgSharpe > 1.0
        ? "text-positive"
        : aggregates.avgSharpe > 0.5
          ? "text-warning"
          : "text-negative";

  return (
    <motion.div 
      variants={MOTION.pageContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10"
    >
      {/* Total Exposure */}
      <motion.div variants={MOTION.itemUp} className="bg-surface border border-subtle rounded-lg p-5 flex flex-col justify-between min-h-[120px]">
        <p className="font-sans text-[10px] font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase">TOTAL EXPOSURE</p>
        <p className="font-mono text-3xl font-semibold text-[var(--text-primary)]">
          <AnimatedNumber value={aggregates.totalExposure * 100} formatter={(v) => `${v.toFixed(1)}%`} />
        </p>
        <p className="font-sans text-xs text-[var(--text-secondary)]">Across active allocations</p>
      </motion.div>

      {/* Computed Portfolios */}
      <motion.div variants={MOTION.itemUp} className="bg-surface border border-subtle rounded-lg p-5 flex flex-col justify-between min-h-[120px]">
        <p className="font-sans text-[10px] font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase">COMPUTED PORTFOLIOS</p>
        <p className="font-mono text-3xl font-semibold text-accent">
          <AnimatedNumber value={aggregates.computedCount} formatter={(v) => v.toFixed(0)} />
        </p>
        <p className="font-sans text-xs text-[var(--text-secondary)]">
          {aggregates.pendingCount} pending computation
        </p>
      </motion.div>

      {/* Avg Sharpe Ratio */}
      <motion.div variants={MOTION.itemUp} className="bg-surface border border-subtle rounded-lg p-5 flex flex-col justify-between min-h-[120px]">
        <p className="font-sans text-[10px] font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase">AVG. SHARPE RATIO</p>
        <p className={`font-mono text-3xl font-semibold ${sharpeColor}`}>
          {aggregates.avgSharpe !== null ? (
            <AnimatedNumber value={aggregates.avgSharpe} formatter={(v) => v.toFixed(2)} />
          ) : "N/A"}
        </p>
        <p className="font-sans text-xs text-[var(--text-secondary)]">Portfolio-weighted average</p>
      </motion.div>

      {/* Risk Exposure */}
      <motion.div variants={MOTION.itemUp} className="bg-surface border border-subtle rounded-lg p-5 flex flex-col justify-between min-h-[120px]">
        <p className="font-sans text-[10px] font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase">RISK EXPOSURE</p>
        <p className={`font-mono text-3xl font-semibold tracking-tight ${riskColor}`}>
          {riskState}
        </p>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${riskState === "CONTROLLED" ? "bg-positive" : riskState === "ELEVATED" ? "bg-warning" : "bg-negative"}`} />
          <p className="font-sans text-xs text-[var(--text-secondary)]">
            {aggregates.avgVolatility !== null ? `${(aggregates.avgVolatility * 100).toFixed(1)}% avg volatility` : "Pending metrics"}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { data: portfolios = [], isLoading, isError } = usePortfolios();

  const formattedDate = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date().toLocaleDateString('en-US', options);
  }, []);

  return (
    <div className="px-8 py-8 w-full select-none">
      <motion.div 
        variants={MOTION.pageContainer}
        initial="hidden"
        animate="show"
        className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4"
      >
        <motion.div variants={MOTION.itemUp}>
          <h1 className="font-serif italic text-[32px] text-[var(--text-primary)]">{(() => {
            const hour = new Date().getHours();
            if (hour < 12) return "Good morning.";
            if (hour < 17) return "Good afternoon.";
            return "Good evening.";
          })()}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xs text-[var(--text-muted)]">{formattedDate}</span>
            <span className="text-[var(--text-muted)]">•</span>
            <span className="font-mono text-xs text-[var(--text-muted)]">{portfolios.length} active portfolios</span>
          </div>
        </motion.div>
        
        <motion.div variants={MOTION.itemUp}>
          <Link href="/portfolio/new">
            <button className="h-10 bg-accent hover:bg-[#3b7de8] text-white font-sans text-[13px] font-medium px-5 rounded-[6px] flex items-center gap-2 transition-all select-none">
              <Plus size={16} />
              Build Portfolio
            </button>
          </Link>
        </motion.div>
      </motion.div>

      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center bg-surface border border-subtle rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : isError ? (
        <div className="bg-surface border border-subtle p-8 text-center text-negative rounded-lg font-sans text-sm">
          Unable to load portfolio dashboard.
        </div>
      ) : portfolios.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-default rounded-xl bg-surface">
          <p className="font-sans text-[14px] text-[var(--text-secondary)] mb-4">No portfolios yet</p>
          <p className="text-xs text-[var(--text-muted)] mb-6 max-w-sm">
            Build your first multi-asset portfolio to calculate risk parameters and analyze market correlations.
          </p>
          <Link href="/portfolio/new">
            <button className="h-9 bg-accent hover:bg-[#3b7de8] text-white font-sans text-xs font-medium px-4 rounded-[6px] transition-all">
              + New Portfolio
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Bento aggregate stats */}
          <DashboardSummary portfolios={portfolios} />

          {/* Section label */}
          <div className="flex items-center justify-between pb-2 border-b border-subtle">
            <span className="font-sans text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)] uppercase">
              ACTIVE PORTFOLIOS
            </span>
            <span className="font-mono text-[11px] text-[var(--text-muted)]">
              [{portfolios.length} TOTAL]
            </span>
          </div>

          {/* Holdings Grid */}
          <PortfolioList />

          {/* Computation Registry */}
          <div className="space-y-4">
            <div className="pb-2 border-b border-subtle">
              <span className="font-sans text-[11px] font-medium tracking-[0.1em] text-[var(--text-muted)] uppercase">
                COMPUTATION REGISTRY
              </span>
            </div>
            
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-subtle">
                    <th className="px-4 py-2.5 font-sans text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-[0.1em]">Portfolio</th>
                    <th className="px-4 py-2.5 font-sans text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-[0.1em]">Status</th>
                    <th className="px-4 py-2.5 font-sans text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-[0.1em]">Assets</th>
                    <th className="px-4 py-2.5 font-sans text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-[0.1em] text-right">Last Computed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle font-sans text-[13px] text-[var(--text-secondary)]">
                  {portfolios.map((portfolio) => {
                    const status = portfolio.status;
                    const statusClass = 
                      status === "ready" 
                        ? "bg-[#34d399]/10 text-positive border border-[#34d399]/20" 
                        : status === "computing" 
                          ? "bg-[#fbbf24]/10 text-warning border border-[#fbbf24]/20" 
                          : "bg-[#f87171]/10 text-negative border border-[#f87171]/20";

                    return (
                      <tr key={portfolio.id} className="hover:bg-elevated transition-colors duration-100 group">
                        <td className="px-4 py-3.5 text-[var(--text-primary)] font-medium">{portfolio.name}</td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase ${statusClass}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-[var(--text-secondary)]">
                          {portfolio.assets.map((asset) => asset.ticker).join(", ")}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-[11px]">
                          {portfolio.last_computed ? new Date(portfolio.last_computed).toLocaleString() : "PENDING"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
