"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Loader2, ShieldAlert, Zap, TrendingDown, Eye, ArrowUpRight } from "lucide-react";
import { usePortfolios } from "@/hooks/usePortfolio";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

export default function RiskStressComparePage() {
  const { data: portfolios = [], isLoading, isError } = usePortfolios();

  const computedPortfolios = useMemo(() => {
    return portfolios.filter(p => p.status === "ready" && p.latest_snapshot);
  }, [portfolios]);

  const stats = useMemo(() => {
    if (computedPortfolios.length === 0) return null;

    let maxDrawdownP = computedPortfolios[0];
    let maxVolP = computedPortfolios[0];
    let minVolP = computedPortfolios[0];
    let totalVolSum = 0;

    computedPortfolios.forEach(p => {
      const snap = p.latest_snapshot!;
      if (snap.max_drawdown !== null && (maxDrawdownP.latest_snapshot?.max_drawdown === null || snap.max_drawdown < (maxDrawdownP.latest_snapshot?.max_drawdown || 0))) {
        maxDrawdownP = p;
      }
      if (snap.portfolio_volatility !== null && (maxVolP.latest_snapshot?.portfolio_volatility === null || snap.portfolio_volatility > (maxVolP.latest_snapshot?.portfolio_volatility || 0))) {
        maxVolP = p;
      }
      if (snap.portfolio_volatility !== null && (minVolP.latest_snapshot?.portfolio_volatility === null || snap.portfolio_volatility < (minVolP.latest_snapshot?.portfolio_volatility || Infinity))) {
        minVolP = p;
      }
      totalVolSum += snap.portfolio_volatility || 0;
    });

    const avgVol = totalVolSum / computedPortfolios.length;

    return {
      maxDrawdownP,
      maxVolP,
      minVolP,
      avgVol
    };
  }, [computedPortfolios]);

  const chartData = useMemo(() => {
    return computedPortfolios.map(p => ({
      name: p.name,
      Volatility: parseFloat(((p.latest_snapshot!.portfolio_volatility || 0) * 100).toFixed(2)),
      Drawdown: parseFloat((Math.abs(p.latest_snapshot!.max_drawdown || 0) * 100).toFixed(2))
    }));
  }, [computedPortfolios]);

  const getRiskPosture = (vol: number | null) => {
    if (vol === null) return "Pending";
    if (vol < 0.12) return { label: "Conservative", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" };
    if (vol < 0.20) return { label: "Balanced", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" };
    if (vol < 0.30) return { label: "Growth", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
    return { label: "Speculative", color: "text-red-500 bg-red-500/10 border-red-500/20" };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] w-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] w-full text-error">
        Failed to load risk comparative analytics.
      </div>
    );
  }

  if (portfolios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] w-full p-4">
        <div className="glass-panel p-12 text-center flex flex-col items-center justify-center max-w-lg border-dashed">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">stress_management</span>
          <h3 className="font-headline-md text-headline-md text-on-surface mb-2">No active risk data</h3>
          <p className="text-on-surface-variant max-w-md mb-6">Create and configure a portfolio to view rolling volatility and tail drawdown analytics.</p>
          <Link href="/portfolio/new">
            <button className="border border-primary text-primary font-label-caps text-label-caps px-6 py-2 hover:bg-primary/10 transition-colors">
              Create Portfolio
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-margin-desktop max-w-[1400px] mx-auto space-y-16">
      {/* Luxury Header */}
      <div className="flex flex-col items-center justify-center text-center space-y-4 mb-8">
        <span className="font-label-caps text-xs text-primary uppercase tracking-[0.3em] font-semibold border border-primary/20 bg-primary/5 px-4 py-1.5 rounded-full">
          Institutional Risk Engine
        </span>
        <h1 className="font-display-lg text-5xl lg:text-6xl text-on-surface tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-on-surface via-on-surface to-on-surface-variant/50">
          Risk & Stress Overview
        </h1>
        <p className="text-on-surface-variant text-lg max-w-2xl font-light">
          Realized volatility parameters, peak drawdown limits, and quantitative risk classifications across your vaults.
        </p>
      </div>

      {stats && (
        <>
          {/* Bento Stats */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl bg-[#111111]/80 backdrop-blur-2xl border border-red-500/20 p-8 flex flex-col justify-between min-h-[160px] group shadow-[0_0_40px_-15px_rgba(239,68,68,0.15)] hover:shadow-[0_0_60px_-15px_rgba(239,68,68,0.25)] transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150"></div>
              <div className="flex justify-between items-start relative z-10">
                <span className="font-label-caps text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">Worst Peak Drawdown</span>
                <ShieldAlert className="w-5 h-5 text-red-500/80" />
              </div>
              <div className="relative z-10 mt-6">
                <div className="text-2xl font-display-md text-on-surface truncate">{stats.maxDrawdownP.name}</div>
                <div className="text-sm text-red-400 font-data-mono mt-2 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  {((stats.maxDrawdownP.latest_snapshot!.max_drawdown ?? 0) * 100).toFixed(2)}% Peak Loss
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl bg-[#111111]/80 backdrop-blur-2xl border border-primary/20 p-8 flex flex-col justify-between min-h-[160px] group shadow-[0_0_40px_-15px_rgba(233,193,118,0.05)] hover:border-primary/40 transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150"></div>
              <div className="flex justify-between items-start relative z-10">
                <span className="font-label-caps text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">Highest Volatility</span>
                <Zap className="w-5 h-5 text-primary/80" />
              </div>
              <div className="relative z-10 mt-6">
                <div className="text-2xl font-display-md text-on-surface truncate">{stats.maxVolP.name}</div>
                <div className="text-sm text-primary/90 font-data-mono mt-2">
                  σ = {((stats.maxVolP.latest_snapshot!.portfolio_volatility ?? 0) * 100).toFixed(2)}%
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl bg-[#111111]/80 backdrop-blur-2xl border border-emerald-500/20 p-8 flex flex-col justify-between min-h-[160px] group shadow-[0_0_40px_-15px_rgba(16,185,129,0.05)] hover:border-emerald-500/40 transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150"></div>
              <div className="flex justify-between items-start relative z-10">
                <span className="font-label-caps text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">Most Stable Vault</span>
                <TrendingDown className="w-5 h-5 text-emerald-500/80" />
              </div>
              <div className="relative z-10 mt-6">
                <div className="text-2xl font-display-md text-on-surface truncate">{stats.minVolP.name}</div>
                <div className="text-sm text-emerald-400 font-data-mono mt-2">
                  σ = {((stats.minVolP.latest_snapshot!.portfolio_volatility ?? 0) * 100).toFixed(2)}%
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl bg-[#111111]/80 backdrop-blur-2xl border border-white/5 p-8 flex flex-col justify-between min-h-[160px] group shadow-2xl hover:bg-[#151515]/80 transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150"></div>
              <div className="flex justify-between items-start relative z-10">
                <span className="font-label-caps text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">Avg. Market Risk</span>
                <Eye className="w-5 h-5 text-on-surface-variant" />
              </div>
              <div className="relative z-10 mt-6">
                <div className="text-4xl font-display-md text-on-surface font-light">{(stats.avgVol * 100).toFixed(2)}<span className="text-xl text-on-surface-variant">%</span></div>
                <div className="text-xs text-on-surface-variant mt-2 uppercase tracking-widest">Systemic average σ</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Comparative Chart */}
          {chartData.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="glass-panel p-8"
            >
              <h3 className="font-headline-md text-headline-md mb-6">Volatility & Drawdown Risk Profile</h3>
              <div className="w-full h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} label={{ value: "Risk Scale (%)", angle: -90, position: "insideLeft", offset: 0 }} />
                    <Tooltip contentStyle={{ backgroundColor: "rgba(28, 27, 27, 0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                    <Legend />
                    <Bar dataKey="Volatility" name="Realized Volatility (%)" fill="#e9c176" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Drawdown" name="Max Peak Drawdown (%)" fill="#ba1a1a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Luxury Risk Table Matrix */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-3xl border border-border/40 bg-surface-container-lowest/40 backdrop-blur-3xl shadow-2xl overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
            <div className="p-8 border-b border-border/40 relative z-10 flex justify-between items-end">
              <div>
                <h3 className="font-display-md text-2xl text-on-surface">Cross-Vault Risk Parameters</h3>
                <p className="text-sm text-on-surface-variant mt-1">Detailed volatility and tail-risk metrics across all active portfolios.</p>
              </div>
            </div>
            <div className="overflow-x-auto relative z-10">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40 bg-surface/30 backdrop-blur-md">
                    <th className="px-10 py-5 font-label-caps text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">Portfolio Name</th>
                    <th className="px-10 py-5 font-label-caps text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">Realized Vol (σ)</th>
                    <th className="px-10 py-5 font-label-caps text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">Max Drawdown</th>
                    <th className="px-10 py-5 font-label-caps text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">Risk Class</th>
                    <th className="px-10 py-5 font-label-caps text-[11px] uppercase tracking-[0.2em] text-on-surface-variant text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20 font-data-mono text-[15px]">
                  {computedPortfolios.map((p) => {
                    const snap = p.latest_snapshot!;
                    const posture = getRiskPosture(snap.portfolio_volatility);
                    return (
                      <tr key={p.id} className="hover:bg-white/[0.02] dark:hover:bg-white/[0.02] transition-colors duration-300 group">
                        <td className="px-10 py-6 font-medium text-on-surface font-sans text-lg">{p.name}</td>
                        <td className="px-10 py-6 text-on-surface/90">
                          {snap.portfolio_volatility !== null ? `${(snap.portfolio_volatility * 100).toFixed(2)}%` : "N/A"}
                        </td>
                        <td className="px-10 py-6 text-error/90 font-medium">
                          {snap.max_drawdown !== null ? `${(snap.max_drawdown * 100).toFixed(2)}%` : "N/A"}
                        </td>
                        <td className="px-10 py-6">
                          {typeof posture === "object" ? (
                            <span className={`px-4 py-1.5 text-xs uppercase tracking-wider font-bold rounded-full border ${posture.color} font-sans shadow-sm`}>
                              {posture.label}
                            </span>
                          ) : (
                            <span className="text-on-surface-variant">Pending</span>
                          )}
                        </td>
                        <td className="px-10 py-6 text-right font-sans">
                          <Link href={`/portfolio/${p.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary/80 hover:text-primary transition-colors border border-transparent hover:border-primary/20 px-4 py-2 rounded-full hover:bg-primary/5">
                            Analyze <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
