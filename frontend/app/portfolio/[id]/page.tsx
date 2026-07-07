"use client";

import { usePortfolio } from "@/hooks/usePortfolio";
import { usePortfolioMetrics, usePortfolioSnapshot, useComputeMetrics } from "@/hooks/useMetrics";
import { useAllocationSummary } from "@/hooks/useAllocation";
import { usePortfolioStore } from "@/store/portfolioStore";
import { Loader2, RefreshCw, FileText } from "lucide-react";
import AnalyticsLoading from "./loading";
import { VolatilityChart } from "@/components/analytics/VolatilityChart";
import { DrawdownChart } from "@/components/analytics/DrawdownChart";
import { ReturnsChart } from "@/components/analytics/ReturnsChart";
import { CorrelationHeatmap } from "@/components/analytics/CorrelationHeatmap";
import { SharpeTable } from "@/components/analytics/SharpeTable";
import { AllocationSummary } from "@/components/allocation/AllocationSummary";
import { motion } from "framer-motion";
import { MOTION } from "@/lib/motion";
import { MetricCards } from "@/components/analytics/MetricCards";

export default function AnalyticsDashboard({ params }: { params: { id: string } }) {
  const { id } = params;
  const { selectedRange, setRange } = usePortfolioStore();
  
  const { data: portfolio, isLoading: isPortfolioLoading } = usePortfolio(id);
  const { data: metrics, isLoading: isMetricsLoading, isFetching: isMetricsFetching, isError: isMetricsError } = usePortfolioMetrics(id, selectedRange);
  const { data: snapshot, isLoading: isSnapshotLoading, isError: isSnapshotError } = usePortfolioSnapshot(id, selectedRange);
  const { data: allocation, isLoading: isAllocationLoading, isError: isAllocationError } = useAllocationSummary(id);
  
  const { mutate: computeMetrics, isPending: isComputing } = useComputeMetrics(id);

  if (isPortfolioLoading || isMetricsLoading || isSnapshotLoading || isAllocationLoading) {
    return <AnalyticsLoading />;
  }

  if (!portfolio || !metrics || !snapshot || !allocation || isMetricsError || isSnapshotError || isAllocationError) {
    return (
      <div className="p-10 text-center text-negative bg-negative/5 border border-negative/20 rounded-lg max-w-lg mx-auto mt-20 font-sans text-sm">
        Failed to load analytics or portfolio is still computing.
      </div>
    );
  }

  const lastUpdated = snapshot.computed_at
    ? new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(
        Math.round((new Date(snapshot.computed_at).getTime() - Date.now()) / 60000),
        "minute",
      )
    : "Not computed";

  const ranges: Array<"1M" | "3M" | "6M" | "1Y"> = ["1M", "3M", "6M", "1Y"];

  return (
    <div className="w-full px-8 py-8 select-none font-sans text-[var(--text-secondary)]">
      <motion.div 
        variants={MOTION.pageContainer}
        initial="hidden"
        animate="show"
        className="space-y-10"
      >
        {/* Workspace Header */}
        <motion.section variants={MOTION.itemUp} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-subtle">
          <div>
            <h1 className="font-serif italic text-[28px] text-[var(--text-primary)] leading-tight">
              {portfolio.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {portfolio.assets.map(a => (
                <span 
                  key={a.ticker} 
                  className="bg-elevated border border-subtle rounded px-2 py-0.5 font-mono text-[11px] text-[var(--text-primary)]"
                >
                  {a.ticker}
                </span>
              ))}
              <span className="text-[var(--text-muted)] mx-1">•</span>
              <span className="font-mono text-[11px] text-[var(--text-muted)]">Updated {lastUpdated}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Date Range Selector Pills */}
            <div className="flex bg-elevated border border-default p-0.5 rounded-md h-8 items-center">
              {ranges.map((range) => (
                <button 
                  key={range}
                  onClick={() => setRange(range)}
                  className={`h-7 px-3 font-mono text-[11px] rounded transition-colors ${
                    selectedRange === range 
                      ? 'text-accent bg-[var(--accent-dim)] font-semibold' 
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button 
              onClick={() => computeMetrics()}
              disabled={isComputing}
              className="h-8 flex items-center gap-1.5 px-3 rounded-md bg-surface border border-default text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-strong transition-colors font-sans text-xs"
            >
              <RefreshCw size={12} className={isComputing ? "animate-spin" : ""} />
              <span>{isComputing ? 'Computing...' : 'Refresh'}</span>
            </button>

            {/* Export Button */}
            <button 
              onClick={async () => {
                if (!portfolio) return;
                try {
                  const { api } = await import("@/lib/api");
                  const response = await api.get(`/api/portfolios/${portfolio.id}/export-csv?range=${selectedRange}`, {
                    responseType: 'blob',
                  });
                  const url = window.URL.createObjectURL(new Blob([response.data]));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `QuantVault_${portfolio.name.replace(/\s+/g, '_')}_Performance.csv`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  window.URL.revokeObjectURL(url);
                } catch (error) {
                  console.error("Export failed", error);
                }
              }}
              className="h-8 flex items-center gap-1.5 px-3 rounded-md bg-surface border border-default text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-strong transition-colors font-sans text-xs"
            >
              <FileText size={12} />
              <span>Export</span>
            </button>
          </div>
        </motion.section>

        {/* Metric Cards strip */}
        <motion.section variants={MOTION.itemUp}>
          <MetricCards snapshot={snapshot} />
        </motion.section>

        {/* Main Analytical Grid */}
        <div className="grid grid-cols-12 gap-6 items-stretch">
          
          {/* Cumulative Returns */}
          <motion.div 
            variants={MOTION.chartReveal} 
            className="col-span-12 bg-surface border border-subtle elev-1 rounded-lg p-5 flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-sans font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase">
                CUMULATIVE PERFORMANCE
              </span>
              {isMetricsFetching && (
                <div className="flex items-center gap-1 text-[11px] text-accent font-mono animate-pulse">
                  <Loader2 size={10} className="animate-spin" />
                  <span>SYNCING...</span>
                </div>
              )}
            </div>
            <div className="w-full h-[360px] relative">
              <ReturnsChart metrics={metrics} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-subtle text-xs">
              <div>
                <span className="font-sans text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">RELATIVE ALPHA</span>
                <p className="font-mono text-base font-semibold text-accent">
                  {metrics.portfolio.at(-1)?.relative_alpha !== null && metrics.portfolio.at(-1)?.relative_alpha !== undefined
                    ? `${(metrics.portfolio.at(-1)!.relative_alpha! * 100).toFixed(2)}%`
                    : "N/A"
                  }
                </p>
              </div>
              <div>
                <span className="font-sans text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">TRACKING DIFFERENCE</span>
                <p className="font-mono text-base font-semibold text-accent">
                  {metrics.portfolio.at(-1)?.tracking_difference !== null && metrics.portfolio.at(-1)?.tracking_difference !== undefined
                    ? `${(metrics.portfolio.at(-1)!.tracking_difference! * 100).toFixed(2)}%`
                    : "N/A"
                  }
                </p>
              </div>
            </div>
          </motion.div>

          {/* Volatility Trend */}
          <motion.div 
            variants={MOTION.chartReveal} 
            className="col-span-12 lg:col-span-6 bg-surface border border-subtle elev-1 rounded-lg p-5 flex flex-col"
          >
            <span className="text-[10px] font-sans font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase mb-4 block">
              30-DAY ROLLING VOLATILITY
            </span>
            <div className="w-full h-[280px]">
              <VolatilityChart metrics={metrics} selectedRange={selectedRange} onRangeChange={setRange} />
            </div>
          </motion.div>

          {/* Drawdown Profile */}
          <motion.div 
            variants={MOTION.chartReveal} 
            className="col-span-12 lg:col-span-6 bg-surface border border-subtle elev-1 rounded-lg p-5 flex flex-col"
          >
            <span className="text-[10px] font-sans font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase mb-4 block">
              UNDERWATER DRAWDOWN ANALYSIS
            </span>
            <div className="w-full h-[280px]">
              <DrawdownChart metrics={metrics} />
            </div>
          </motion.div>

          {/* Correlation Heatmap */}
          <motion.div variants={MOTION.chartReveal} className="col-span-12">
            <CorrelationHeatmap matrix={snapshot.correlation_matrix} assets={portfolio.assets} />
          </motion.div>

          {/* Attribution & Allocation panels */}
          <motion.div variants={MOTION.chartReveal} className="col-span-12 lg:col-span-5">
            <SharpeTable snapshot={snapshot} assets={portfolio.assets} />
          </motion.div>

          <motion.div variants={MOTION.chartReveal} className="col-span-12 lg:col-span-7">
            <AllocationSummary allocation={allocation} assets={portfolio.assets} />
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}
