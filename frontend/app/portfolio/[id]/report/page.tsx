"use client";

import { useMemo, useState } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { usePortfolioMetrics, usePortfolioSnapshot } from "@/hooks/useMetrics";
import { usePortfolioStore } from "@/store/portfolioStore";
import { useAllocationSummary } from "@/hooks/useAllocation";
import { AllocationSummary } from "@/components/allocation/AllocationSummary";
import { ReturnsChart } from "@/components/analytics/ReturnsChart";
import { VolatilityChart } from "@/components/analytics/VolatilityChart";
import { DrawdownChart } from "@/components/analytics/DrawdownChart";
import { CorrelationHeatmap } from "@/components/analytics/CorrelationHeatmap";
import { SharpeTable } from "@/components/analytics/SharpeTable";
import { Loader2, Download } from "lucide-react";

const formatPct = (value: number | null | undefined, digits = 2) =>
  value === null || value === undefined ? "N/A" : `${(value * 100).toFixed(digits)}%`;

const formatNumber = (value: number | null | undefined, digits = 2) =>
  value === null || value === undefined ? "N/A" : value.toFixed(digits);

export default function PortfolioReportPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { selectedRange } = usePortfolioStore();
  const { data: portfolio, isLoading: isPortfolioLoading } = usePortfolio(id);
  const { data: metrics, isLoading: isMetricsLoading } = usePortfolioMetrics(id, selectedRange);
  const { data: snapshot, isLoading: isSnapshotLoading } = usePortfolioSnapshot(id, selectedRange);
  const { data: allocation, isLoading: isAllocationLoading } = useAllocationSummary(id);

  const isLoading = isPortfolioLoading || isMetricsLoading || isSnapshotLoading || isAllocationLoading;
  const generatedAt = useMemo(() => new Date().toLocaleString(), []);
  const latestAlpha = metrics?.portfolio.at(-1)?.relative_alpha;
  const latestTracking = metrics?.portfolio.at(-1)?.tracking_difference;
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!portfolio) return;
    
    setIsDownloading(true);
    try {
      const { api } = await import("@/lib/api");
      const response = await api.get(`/api/portfolios/${portfolio.id}/export-csv?range=${selectedRange}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = `QuantVault_${portfolio.name.replace(/\s+/g, '_')}_Performance.csv`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV export failed", error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-transparent p-10 text-[var(--text-primary)]">
        <div className="mx-auto max-w-[1100px] bg-surface border border-subtle rounded-lg p-10 font-sans text-xs">
          Preparing institutional report...
        </div>
      </main>
    );
  }

  if (!portfolio || !metrics || !snapshot || !allocation) {
    return (
      <main className="min-h-screen bg-transparent p-10 text-[var(--text-primary)]">
        <div className="mx-auto max-w-[1100px] bg-surface border border-subtle rounded-lg p-10 text-negative font-sans text-xs">
          Report data is unavailable.
        </div>
      </main>
    );
  }

  return (
    <main data-report-ready="true" className="report-page min-h-screen bg-transparent text-[var(--text-secondary)] font-sans">
      <div id="report-content" className="mx-auto max-w-[1100px] px-8 py-10 bg-transparent text-[var(--text-secondary)]">
        {/* PAGE 1: Core Metrics & Returns Chart */}
        <div className="flex flex-col gap-6">
          <header className="report-section flex items-start justify-between gap-8 border-b border-subtle pb-6">
            <div>
              <p className="font-sans text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-[0.2em]">RiskMatrix Institutional Report</p>
              <h1 className="mt-2 font-serif italic text-3xl text-[var(--text-primary)]">{portfolio.name}</h1>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">Generated {generatedAt} &bull; Snapshot {snapshot.date || "not computed"}</p>
            </div>
            <div className="text-right flex flex-col items-end gap-3">
              <div>
                <p className="font-sans text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Portfolio ID</p>
                <p className="mt-1 max-w-[280px] break-all font-mono text-xs text-[var(--text-primary)]">{portfolio.id}</p>
              </div>
              <button 
                onClick={handleDownload}
                disabled={isDownloading}
                data-html2canvas-ignore="true"
                className="print:hidden h-10 flex items-center gap-1.5 px-5 bg-accent hover:bg-accent-hover text-[var(--accent-foreground)] font-sans text-[13px] font-medium rounded-[6px] transition-all disabled:opacity-50"
              >
                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download size={14} />}
                <span>{isDownloading ? "Exporting..." : "Export CSV"}</span>
              </button>
            </div>
          </header>

          <section className="report-section grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              ["Annualized Return", formatPct(snapshot.annualized_return)],
              ["Volatility", formatPct(snapshot.portfolio_volatility)],
              ["Max Drawdown", formatPct(snapshot.max_drawdown)],
              ["Sharpe Ratio", formatNumber(snapshot.sharpe_ratio)],
            ].map(([label, value]) => (
              <div key={label} className="bg-surface border border-subtle rounded-lg p-5">
                <p className="font-sans text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
                <p className="mt-3 font-mono text-[24px] font-semibold text-accent">{value}</p>
              </div>
            ))}
          </section>

          <section className="report-section grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-surface border border-subtle rounded-lg p-5">
              <p className="font-sans text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Relative Alpha</p>
              <p className="mt-3 font-mono text-[24px] font-semibold text-accent">{formatPct(latestAlpha)}</p>
            </div>
            <div className="bg-surface border border-subtle rounded-lg p-5">
              <p className="font-sans text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Tracking Difference</p>
              <p className="mt-3 font-mono text-[24px] font-semibold text-accent">{formatPct(latestTracking)}</p>
            </div>
          </section>

          <section className="report-section bg-surface border border-subtle rounded-lg p-5 flex flex-col justify-between">
            <span className="text-[10px] font-sans font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase mb-4 block">Performance vs Benchmark</span>
            <div className="h-[280px]">
              <ReturnsChart metrics={metrics} />
            </div>
          </section>
        </div>

        {/* PAGE BREAK 1 */}
        <div className="pdf-page-break" />

        {/* PAGE 2: Risk Trends & Asset Allocation */}
        <div className="flex flex-col gap-6 mt-10 pdf-export-active:mt-0 pdf-export-active:pt-4">
          <div className="pdf-export-only justify-between items-center border-b border-subtle pb-2 text-[var(--text-muted)] font-sans text-[9px] uppercase tracking-widest">
            <span>RiskMatrix Institutional Report &bull; {portfolio.name}</span>
            <span>Page 2</span>
          </div>

          <section className="report-section grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-surface border border-subtle rounded-lg p-5">
              <span className="text-[10px] font-sans font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase mb-3 block">Volatility Trend</span>
              <div className="h-[220px]">
                <VolatilityChart metrics={metrics} selectedRange={selectedRange} onRangeChange={() => undefined} showRangeControls={false} />
              </div>
            </div>
            <div className="bg-surface border border-subtle rounded-lg p-5">
              <span className="text-[10px] font-sans font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase mb-3 block">Drawdown Analytics</span>
              <div className="h-[220px]">
                <DrawdownChart metrics={metrics} />
              </div>
            </div>
          </section>

          <section className="report-section">
            <AllocationSummary allocation={allocation} assets={portfolio.assets} />
          </section>
        </div>

        {/* PAGE BREAK 2 */}
        <div className="pdf-page-break" />

        {/* PAGE 3: Sharpe Table & Correlation Heatmap */}
        <div className="flex flex-col gap-6 mt-10 pdf-export-active:mt-0 pdf-export-active:pt-4">
          <div className="pdf-export-only justify-between items-center border-b border-subtle pb-2 text-[var(--text-muted)] font-sans text-[9px] uppercase tracking-widest">
            <span>RiskMatrix Institutional Report &bull; {portfolio.name}</span>
            <span>Page 3</span>
          </div>

          <section className="report-section grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
            <div>
              <SharpeTable snapshot={snapshot} assets={portfolio.assets} />
            </div>
            <div>
              <CorrelationHeatmap matrix={snapshot.correlation_matrix} assets={portfolio.assets} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
