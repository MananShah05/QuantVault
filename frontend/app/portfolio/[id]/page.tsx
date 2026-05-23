"use client";

import { usePortfolio } from "@/hooks/usePortfolio";
import { usePortfolioMetrics, usePortfolioSnapshot, useComputeMetrics } from "@/hooks/useMetrics";
import { useAllocationSummary } from "@/hooks/useAllocation";
import { usePortfolioStore } from "@/store/portfolioStore";
import { Loader2, RefreshCw } from "lucide-react";
import AnalyticsLoading from "./loading";
import { VolatilityChart } from "@/components/analytics/VolatilityChart";
import { DrawdownChart } from "@/components/analytics/DrawdownChart";
import { ReturnsChart } from "@/components/analytics/ReturnsChart";
import { CorrelationHeatmap } from "@/components/analytics/CorrelationHeatmap";
import { SharpeTable } from "@/components/analytics/SharpeTable";
import { AllocationSummary } from "@/components/allocation/AllocationSummary";
import Link from "next/link";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

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
    return <div className="p-10 text-center text-error bg-error-container/10 border border-error/20 rounded-xl max-w-lg mx-auto mt-20">Failed to load analytics or portfolio is still computing.</div>;
  }

  const formatPercent = (val: number | null | undefined) => val === null || val === undefined ? "N/A" : (val * 100).toFixed(2) + "%";
  const formatNumber = (val: number | null | undefined) => val === null || val === undefined ? "N/A" : val.toFixed(2);
  const lastUpdated = snapshot.computed_at
    ? new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(
        Math.round((new Date(snapshot.computed_at).getTime() - Date.now()) / 60000),
        "minute",
      )
    : "Not computed";
  const benchmarkName = portfolio.assets.some((asset) => asset.ticker.endsWith(".NS") || asset.ticker.endsWith(".BO"))
    ? "NIFTYBEES.NS"
    : "SPY";
  const latestAlpha = metrics.portfolio.at(-1)?.relative_alpha;
  const latestTrackingDifference = metrics.portfolio.at(-1)?.tracking_difference;
  const riskScore = allocation.diversification_score;
  const riskPosture = riskScore >= 75 ? "Diversified" : riskScore >= 50 ? "Balanced" : "Concentrated";
  const ranges: Array<"1M" | "3M" | "6M" | "1Y"> = ["1M", "3M", "6M", "1Y"];

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12">
      {/* Hero Section & Date Selector */}
      <section className="mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-10">
          <div>
            <span className="font-label-caps text-label-caps text-primary mb-2 block uppercase tracking-[0.2em]">Institutional Portfolio Analysis</span>
            <h1 className="font-display-lg text-display-lg text-on-surface">{portfolio.name}</h1>
            <p className="mt-3 font-label-caps text-label-caps text-on-surface-variant">Last updated {lastUpdated}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 bg-surface-container-high p-1 rounded-lg border border-border">
            {ranges.map((range) => (
              <button 
                key={range}
                onClick={() => setRange(range)}
                className={`px-4 py-2 font-label-caps text-label-caps transition-colors ${selectedRange === range ? 'text-primary bg-accent rounded font-bold' : 'text-on-surface-variant hover:text-primary'}`}
              >
                {range}
              </button>
            ))}
            <div className="h-4 w-[1px] bg-border mx-2"></div>
            <button 
              onClick={() => computeMetrics()}
              disabled={isComputing}
              className="flex items-center gap-2 px-4 py-2 font-label-caps text-label-caps text-on-surface-variant hover:text-primary"
            >
              {isComputing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} {isComputing ? 'Computing...' : 'Refresh'}
            </button>
            <Link href={`/portfolio/${id}/report`} className="px-4 py-2 font-label-caps text-label-caps text-primary hover:text-on-surface">
              Report
            </Link>
          </div>
        </div>

        {/* Executive Summary Bento Cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-4 gap-gutter-desktop"
        >
          <motion.div 
            variants={itemVariants} 
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="glass-panel p-6 flex flex-col justify-between min-h-[160px]"
          >
            <div className="flex justify-between items-start">
              <span className="font-label-caps text-label-caps text-on-surface-variant">Total Exposure</span>
              <span className="material-symbols-outlined text-primary">donut_large</span>
            </div>
            <div>
              <div className="text-[28px] font-data-mono text-on-surface">{formatPercent(allocation.total_exposure)}</div>
              <div className="flex items-center gap-1 text-[12px] text-primary mt-1">
                <span className="material-symbols-outlined text-[14px]">sync_alt</span> live allocation
              </div>
            </div>
          </motion.div>
          <motion.div 
            variants={itemVariants} 
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="glass-panel p-6 flex flex-col justify-between min-h-[160px]"
          >
            <div className="flex justify-between items-start">
              <span className="font-label-caps text-label-caps text-on-surface-variant">Annualized Return</span>
              <span className="material-symbols-outlined text-primary">insights</span>
            </div>
            <div>
              <div className="text-[28px] font-data-mono text-on-surface">{formatPercent(snapshot.annualized_return)}</div>
              <div className="flex items-center gap-1 text-[12px] text-on-surface-variant mt-1">
                <span className="material-symbols-outlined text-[14px]">timeline</span> latest snapshot
              </div>
            </div>
          </motion.div>
          <motion.div 
            variants={itemVariants} 
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="glass-panel p-6 flex flex-col justify-between min-h-[160px]"
          >
            <div className="flex justify-between items-start">
              <span className="font-label-caps text-label-caps text-on-surface-variant">Volatility (σ)</span>
              <span className="material-symbols-outlined text-primary">show_chart</span>
            </div>
            <div>
              <div className="text-[28px] font-data-mono text-on-surface">{formatPercent(snapshot.portfolio_volatility)}</div>
              <div className="flex items-center gap-1 text-[12px] text-on-surface-variant mt-1">
                <span className="material-symbols-outlined text-[14px]">query_stats</span> realized risk
              </div>
            </div>
          </motion.div>
          <motion.div 
            variants={itemVariants} 
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="glass-panel p-6 flex flex-col justify-between min-h-[160px]"
          >
            <div className="flex justify-between items-start">
              <span className="font-label-caps text-label-caps text-on-surface-variant">Sharpe Ratio</span>
              <span className="material-symbols-outlined text-primary">verified</span>
            </div>
            <div>
              <div className="text-[28px] font-data-mono text-on-surface">{formatNumber(snapshot.sharpe_ratio)}</div>
              <div className="flex items-center gap-1 text-[12px] text-primary mt-1">
                <span className="material-symbols-outlined text-[14px]">verified</span> risk adjusted
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Main Analytical Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-12 gap-gutter-desktop"
      >
        
        {/* Cumulative Returns */}
        <motion.div variants={itemVariants} className="col-span-12 lg:col-span-8 glass-panel p-8 relative overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-md text-headline-md text-on-surface">Cumulative Performance vs Benchmark</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="font-label-caps text-label-caps text-on-surface-variant text-[10px]">{portfolio.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-secondary"></div>
                <span className="font-label-caps text-label-caps text-on-surface-variant text-[10px]">{benchmarkName}</span>
              </div>
            </div>
          </div>
          {isMetricsFetching && <div className="absolute right-8 top-8 flex items-center gap-2 text-primary text-xs"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating range</div>}
          <div className="flex-1 w-full relative min-h-[350px]">
            <ReturnsChart metrics={metrics} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-label-caps text-label-caps text-on-surface-variant">Relative Alpha</span>
              <p className="font-data-mono text-primary">{formatPercent(latestAlpha)}</p>
            </div>
            <div>
              <span className="font-label-caps text-label-caps text-on-surface-variant">Tracking Difference</span>
              <p className="font-data-mono text-primary">{formatPercent(latestTrackingDifference)}</p>
            </div>
          </div>
        </motion.div>

        {/* Sharpe Table & Risk Stats */}
        <motion.div variants={itemVariants} className="col-span-12 lg:col-span-4 space-y-gutter-desktop">
          <SharpeTable snapshot={snapshot} assets={portfolio.assets} />
          
          <div className="glass-panel p-8">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-4">Risk Sentiment</h3>
            <div className="flex items-end gap-2 mb-6">
              <span className="text-[32px] font-data-mono leading-none">{riskPosture}</span>
              <span className="text-label-caps text-on-surface-variant mb-1">Index: {riskScore.toFixed(1)}/100</span>
            </div>
            <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{width: `${riskScore}%`}}></div>
            </div>
            <p className="mt-4 text-body-md text-on-surface-variant opacity-80 leading-relaxed italic">
                Top sector: {allocation.top_sector}. Average intra-portfolio correlation: {allocation.intra_portfolio_correlation.toFixed(2)}.
            </p>
          </div>
        </motion.div>

        {/* Volatility Trend */}
        <motion.div variants={itemVariants} className="col-span-12 lg:col-span-6 glass-panel p-8 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Volatility Trend</h3>
              <p className="font-label-caps text-label-caps text-on-surface-variant mt-1">Rolling 30-Day Realized σ</p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">info</span>
          </div>
          <div className="flex-1 w-full min-h-[240px]">
            <VolatilityChart metrics={metrics} selectedRange={selectedRange} onRangeChange={setRange} />
          </div>
        </motion.div>

        {/* Drawdown Profile */}
        <motion.div variants={itemVariants} className="col-span-12 lg:col-span-6 glass-panel p-8 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Drawdown Profile</h3>
              <p className="font-label-caps text-label-caps text-on-surface-variant mt-1">Underwater Analysis (%)</p>
            </div>
            <span className="text-error font-data-mono text-[14px]">Max: {formatPercent(snapshot.max_drawdown)}</span>
          </div>
          <div className="flex-1 w-full min-h-[240px]">
            <DrawdownChart metrics={metrics} />
          </div>
        </motion.div>

        {/* Correlation Heatmap */}
        <motion.div variants={itemVariants} className="col-span-12 glass-panel p-8">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-8">Cross-Asset Correlation</h3>
          <div className="w-full flex justify-center">
            <CorrelationHeatmap matrix={snapshot.correlation_matrix} assets={portfolio.assets} />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="col-span-12">
          <AllocationSummary allocation={allocation} assets={portfolio.assets} />
        </motion.div>

      </motion.div>
    </div>
  );
}
