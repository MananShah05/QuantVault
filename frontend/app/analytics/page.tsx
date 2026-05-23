"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Loader2, TrendingUp, Award, Activity, Grid, ArrowUpRight } from "lucide-react";
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

export default function AnalyticsComparePage() {
  const { data: portfolios = [], isLoading, isError } = usePortfolios();

  const computedPortfolios = useMemo(() => {
    return portfolios.filter(p => p.status === "ready" && p.latest_snapshot);
  }, [portfolios]);

  const stats = useMemo(() => {
    if (computedPortfolios.length === 0) return null;

    let bestReturn = computedPortfolios[0];
    let bestSharpe = computedPortfolios[0];
    let totalReturnSum = 0;
    let totalAssetsCount = 0;

    computedPortfolios.forEach(p => {
      const snap = p.latest_snapshot!;
      const annReturn = snap.annualized_return ?? 0;
      const sharpe = snap.sharpe_ratio ?? 0;

      const bestAnnReturn = bestReturn.latest_snapshot?.annualized_return ?? -Infinity;
      const bestSharpeRatio = bestSharpe.latest_snapshot?.sharpe_ratio ?? -Infinity;

      if (annReturn > bestAnnReturn) {
        bestReturn = p;
      }
      if (sharpe > bestSharpeRatio) {
        bestSharpe = p;
      }
      totalReturnSum += annReturn;
      totalAssetsCount += p.assets.length;
    });

    const avgReturn = totalReturnSum / computedPortfolios.length;

    return {
      bestReturn,
      bestSharpe,
      avgReturn,
      totalAssetsCount
    };
  }, [computedPortfolios]);

  const chartData = useMemo(() => {
    return computedPortfolios.map(p => ({
      name: p.name,
      Return: parseFloat(((p.latest_snapshot!.annualized_return ?? 0) * 100).toFixed(2)),
      Sharpe: parseFloat((p.latest_snapshot!.sharpe_ratio ?? 0).toFixed(2))
    }));
  }, [computedPortfolios]);

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
        Failed to load portfolio comparative analytics.
      </div>
    );
  }

  if (portfolios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] w-full p-4">
        <div className="glass-panel p-12 text-center flex flex-col items-center justify-center max-w-lg border-dashed">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">analytics</span>
          <h3 className="font-headline-md text-headline-md text-on-surface mb-2">No active portfolios</h3>
          <p className="text-on-surface-variant max-w-md mb-6">Create your first multi-asset portfolio to see performance attribution and metrics comparison.</p>
          <Link href="/portfolio/new">
            <button className="border border-primary text-primary font-label-caps text-label-caps px-6 py-2 hover:bg-primary/10 transition-colors">
              Start Building
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-margin-desktop max-w-container-max mx-auto space-y-12">
      {/* Header */}
      <div>
        <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest mb-2 block">Performance Attribution</span>
        <h1 className="font-display-lg text-display-lg text-on-surface">Vault Analytics</h1>
        <p className="text-on-surface-variant mt-2 text-sm">Comparative performance metrics, Sharpe ratios, and annualized returns across all active portfolios.</p>
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
            <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col justify-between min-h-[140px] platinum-gradient">
              <div className="flex justify-between items-start">
                <span className="font-label-caps text-label-caps text-on-surface-variant">Top Performer</span>
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-xl font-bold truncate max-w-[180px]">{stats.bestReturn.name}</div>
                <div className="text-xs text-primary font-data-mono mt-1">
                  +{((stats.bestReturn.latest_snapshot!.annualized_return ?? 0) * 100).toFixed(2)}% Ann. Return
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col justify-between min-h-[140px]">
              <div className="flex justify-between items-start">
                <span className="font-label-caps text-label-caps text-on-surface-variant">Most Efficient</span>
                <Award className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-xl font-bold truncate max-w-[180px]">{stats.bestSharpe.name}</div>
                <div className="text-xs text-primary font-data-mono mt-1">
                  Sharpe: {(stats.bestSharpe.latest_snapshot!.sharpe_ratio ?? 0).toFixed(2)}
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col justify-between min-h-[140px]">
              <div className="flex justify-between items-start">
                <span className="font-label-caps text-label-caps text-on-surface-variant">Avg. Return Rate</span>
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-data-mono text-on-surface">{(stats.avgReturn * 100).toFixed(2)}%</div>
                <div className="text-xs text-on-surface-variant mt-1">Across ready portfolios</div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col justify-between min-h-[140px]">
              <div className="flex justify-between items-start">
                <span className="font-label-caps text-label-caps text-on-surface-variant">Total Assets Tracked</span>
                <Grid className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-data-mono text-on-surface">{stats.totalAssetsCount}</div>
                <div className="text-xs text-on-surface-variant mt-1">Instrument holdings</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Comparative Recharts Section */}
          {chartData.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="glass-panel p-8"
            >
              <h3 className="font-headline-md text-headline-md mb-6">Return vs Sharpe Ratio Contrast</h3>
              <div className="w-full h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} />
                    <YAxis yAxisId="left" stroke="#e9c176" fontSize={12} tickLine={false} label={{ value: "Annual Return (%)", angle: -90, position: "insideLeft", offset: 0, fill: "#e9c176" }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={12} tickLine={false} label={{ value: "Sharpe Ratio", angle: 90, position: "insideRight", offset: 0, fill: "#888888" }} />
                    <Tooltip contentStyle={{ backgroundColor: "rgba(28, 27, 27, 0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="Return" name="Annualized Return (%)" fill="#e9c176" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="Sharpe" name="Sharpe Ratio" fill="#888888" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Matrix table list */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="glass-panel overflow-hidden"
          >
            <div className="p-6 border-b border-border">
              <h3 className="font-headline-md text-headline-md">Performance Comparison Matrix</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/10">
                    <th className="px-8 py-4 font-label-caps text-label-caps text-on-surface-variant">Portfolio Name</th>
                    <th className="px-8 py-4 font-label-caps text-label-caps text-on-surface-variant">Annualized Return</th>
                    <th className="px-8 py-4 font-label-caps text-label-caps text-on-surface-variant">Sharpe Ratio</th>
                    <th className="px-8 py-4 font-label-caps text-label-caps text-on-surface-variant">Max Drawdown</th>
                    <th className="px-8 py-4 font-label-caps text-label-caps text-on-surface-variant text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-data-mono text-sm">
                  {computedPortfolios.map((p) => {
                    const snap = p.latest_snapshot!;
                    return (
                      <tr key={p.id} className="hover:bg-accent/40 transition-colors">
                        <td className="px-8 py-5 font-semibold text-on-surface font-sans">{p.name}</td>
                        <td className="px-8 py-5 text-primary">{((snap.annualized_return ?? 0) * 100).toFixed(2)}%</td>
                        <td className="px-8 py-5 text-on-surface">{(snap.sharpe_ratio ?? 0).toFixed(2)}</td>
                        <td className="px-8 py-5 text-error">{((snap.max_drawdown ?? 0) * 100).toFixed(2)}%</td>
                        <td className="px-8 py-5 text-right font-sans">
                          <Link href={`/portfolio/${p.id}`} className="text-primary hover:underline inline-flex items-center gap-1 text-xs font-semibold">
                            Deep Analysis <ArrowUpRight className="w-3 h-3" />
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
