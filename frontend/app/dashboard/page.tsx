"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { usePortfolios, useDeletePortfolio } from "@/hooks/usePortfolio";
import { PortfolioListItem } from "@/types";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

const formatPct = (value: number | null | undefined, digits = 1) =>
  value === null || value === undefined ? "N/A" : `${(value * 100).toFixed(digits)}%`;

const formatNumber = (value: number | null | undefined, digits = 2) =>
  value === null || value === undefined ? "N/A" : value.toFixed(digits);

function average(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => value !== null && value !== undefined);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}

function DashboardSummary({ portfolios }: { portfolios: PortfolioListItem[] }) {
  const aggregates = useMemo(() => {
    const snapshots = portfolios.map((portfolio) => portfolio.latest_snapshot).filter(Boolean);
    const avgSharpe = average(snapshots.map((snapshot) => snapshot?.sharpe_ratio));
    const avgVolatility = average(snapshots.map((snapshot) => snapshot?.portfolio_volatility));
    const avgReturn = average(snapshots.map((snapshot) => snapshot?.annualized_return));
    const totalExposure = portfolios.reduce(
      (sum, portfolio) => sum + portfolio.assets.reduce((assetSum, asset) => assetSum + asset.weight, 0),
      0,
    );
    const computedCount = portfolios.filter((portfolio) => portfolio.status === "ready" && portfolio.latest_snapshot).length;
    return { avgSharpe, avgVolatility, avgReturn, totalExposure, computedCount };
  }, [portfolios]);

  const riskState =
    aggregates.avgVolatility === null
      ? "Pending"
      : aggregates.avgVolatility < 0.18
        ? "Controlled"
        : aggregates.avgVolatility < 0.28
          ? "Elevated"
          : "High";

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
    >
      <motion.div variants={itemVariants} className="glass-panel p-6 platinum-gradient">
        <p className="font-label-caps text-label-caps text-on-surface-variant mb-4">Total Exposure</p>
        <p className="font-headline-lg text-headline-lg text-primary">{formatPct(aggregates.totalExposure)}</p>
        <p className="font-data-mono text-data-mono text-on-surface-variant mt-2">Across active portfolios</p>
      </motion.div>
      <motion.div variants={itemVariants} className="glass-panel p-6">
        <p className="font-label-caps text-label-caps text-on-surface-variant mb-4">Computed Portfolios</p>
        <p className="font-headline-lg text-headline-lg text-on-surface">{aggregates.computedCount}</p>
        <p className="font-data-mono text-data-mono text-on-surface-variant mt-2">{portfolios.length} total</p>
      </motion.div>
      <motion.div variants={itemVariants} className="glass-panel p-6">
        <p className="font-label-caps text-label-caps text-on-surface-variant mb-4">Avg. Sharpe Ratio</p>
        <p className="font-headline-lg text-headline-lg text-on-surface">{formatNumber(aggregates.avgSharpe)}</p>
        <p className="font-data-mono text-data-mono text-on-surface-variant mt-2">Latest snapshots</p>
      </motion.div>
      <motion.div variants={itemVariants} className="glass-panel p-6">
        <p className="font-label-caps text-label-caps text-on-surface-variant mb-4">Risk Exposure</p>
        <p className="font-headline-lg text-headline-lg text-on-surface">{riskState}</p>
        <p className="font-data-mono text-data-mono text-on-surface-variant mt-2">{formatPct(aggregates.avgVolatility)} avg volatility</p>
      </motion.div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { data: portfolios = [], isLoading, isError } = usePortfolios();
  const { mutate: deletePortfolio } = useDeletePortfolio();

  return (
    <div className="p-margin-desktop max-w-container-max mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12">
        <div>
          <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest mb-2 block">Executive Overview</span>
          <h1 className="font-display-lg text-display-lg">Portfolio QuantVault</h1>
        </div>
        <div className="mt-6 md:mt-0">
          <Link href="/portfolio/new">
            <button className="bg-primary text-background font-label-caps text-label-caps px-8 py-4 flex items-center gap-3 hover:bg-primary-fixed transition-all duration-300 shadow-xl group">
              <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add</span>
              Create Portfolio
            </button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[360px] items-center justify-center glass-panel">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="glass-panel p-12 text-center text-error">Unable to load portfolio dashboard.</div>
      ) : portfolios.length === 0 ? (
        <div className="glass-panel p-12 text-center flex flex-col items-center justify-center border-dashed border-border rounded-xl bg-muted/20">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">folder_open</span>
          <h3 className="font-headline-md text-headline-md text-on-surface mb-2">No active portfolios</h3>
          <p className="text-on-surface-variant max-w-md mb-6">Create your first multi-asset portfolio to see risk analytics and performance attribution here.</p>
          <Link href="/portfolio/new">
            <button className="border border-primary text-primary font-label-caps text-label-caps px-6 py-2 hover:bg-primary/10 transition-colors">
              Start Building
            </button>
          </Link>
        </div>
      ) : (
        <>
          <DashboardSummary portfolios={portfolios} />

          <h2 className="font-label-caps text-label-caps text-primary uppercase tracking-widest mb-6">Holdings Panels</h2>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 xl:grid-cols-2 gap-8"
          >
            {portfolios.map((portfolio) => {
              const snap = portfolio.latest_snapshot;
              const topHolding = [...portfolio.assets].sort((a, b) => b.weight - a.weight)[0];

              return (
                <motion.div 
                  key={portfolio.id} 
                  variants={itemVariants}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="glass-panel group overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="p-8 border-b border-border flex justify-between items-start">
                      <div>
                        <h3 className="font-headline-md text-headline-md mb-1">{portfolio.name}</h3>
                        <p className="text-on-surface-variant text-sm">
                          {portfolio.last_computed
                            ? `Updated ${new Date(portfolio.last_computed).toLocaleString()}`
                            : `Created ${new Date(portfolio.created_at).toLocaleString()}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary-container">monitoring</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to delete "${portfolio.name}"?`)) {
                              deletePortfolio(portfolio.id);
                            }
                          }}
                          className="text-on-surface-variant/40 hover:text-red-500 transition-colors p-1"
                          title="Delete Portfolio"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>
                    <div className="p-8 pb-0">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                          <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">Ann. Return</p>
                          <p className="font-data-mono text-data-mono text-lg text-primary">{formatPct(snap?.annualized_return)}</p>
                        </div>
                        <div>
                          <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">Volatility</p>
                          <p className="font-data-mono text-data-mono text-lg">{formatPct(snap?.portfolio_volatility)}</p>
                        </div>
                        <div>
                          <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">Max Drawdown</p>
                          <p className="font-data-mono text-data-mono text-lg text-error">{formatPct(snap?.max_drawdown)}</p>
                        </div>
                        <div>
                          <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">Sharpe Ratio</p>
                          <p className="font-data-mono text-data-mono text-lg text-primary">{formatNumber(snap?.sharpe_ratio)}</p>
                        </div>
                      </div>

                      <div className="mt-8 space-y-3">
                        {portfolio.assets.map((asset) => (
                          <div key={asset.ticker}>
                            <div className="flex items-center justify-between gap-4 text-sm">
                              <span className="text-on-surface">{asset.display_name || asset.ticker}</span>
                              <span className="font-data-mono text-primary">{formatPct(asset.weight)}</span>
                            </div>
                            <div className="mt-2 h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${asset.weight * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="px-8 py-4 bg-muted/20 flex justify-between items-center group-hover:bg-accent transition-colors mt-4">
                    <span className="text-xs text-on-surface-variant font-label-caps">
                      Top holding {topHolding?.ticker || "N/A"}
                    </span>
                    <Link href={`/portfolio/${portfolio.id}`}>
                      <button className="text-primary font-label-caps text-label-caps flex items-center gap-2 font-bold">
                        Details <span className="material-symbols-outlined text-sm font-bold">arrow_forward_ios</span>
                      </button>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-16"
          >
            <h2 className="font-label-caps text-label-caps text-primary uppercase tracking-widest mb-6">Latest Snapshot Register</h2>
            <div className="glass-panel overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-8 py-4 font-label-caps text-label-caps text-on-surface-variant">Portfolio</th>
                    <th className="px-8 py-4 font-label-caps text-label-caps text-on-surface-variant">Status</th>
                    <th className="px-8 py-4 font-label-caps text-label-caps text-on-surface-variant">Assets</th>
                    <th className="px-8 py-4 font-label-caps text-label-caps text-on-surface-variant text-right">Last Computed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-data-mono text-sm">
                  {portfolios.map((portfolio) => (
                    <tr key={portfolio.id} className="hover:bg-accent transition-colors">
                      <td className="px-8 py-5 font-semibold">{portfolio.name}</td>
                      <td className="px-8 py-5 text-on-surface-variant">{portfolio.status}</td>
                      <td className="px-8 py-5 text-on-surface-variant">{portfolio.assets.map((asset) => asset.ticker).join(", ")}</td>
                      <td className="px-8 py-5 text-right font-semibold">
                        {portfolio.last_computed ? new Date(portfolio.last_computed).toLocaleString() : "Pending"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
