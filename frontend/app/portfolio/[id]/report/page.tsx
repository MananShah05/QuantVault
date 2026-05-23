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
    const element = document.getElementById("report-content");
    if (!element) return;
    
    setIsDownloading(true);
    // Force strict width and PDF export styling
    const originalWidth = element.style.width;
    const originalMaxWidth = element.style.maxWidth;
    element.style.width = "1100px";
    element.style.maxWidth = "1100px";
    element.classList.add("pdf-export-active");
    
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin: 10,
        filename: `${portfolio?.name || 'Portfolio'}_QuantVault_Report.pdf`,
        image: { type: 'jpeg' as const, quality: 1 },
        html2canvas: { scale: 2, useCORS: true, windowWidth: 1100 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' as const },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] as const }
      };
      
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF generation failed", error);
    } finally {
      element.style.width = originalWidth;
      element.style.maxWidth = originalMaxWidth;
      element.classList.remove("pdf-export-active");
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background p-10 text-on-surface">
        <div className="mx-auto max-w-[1100px] glass-panel p-10">Preparing institutional report...</div>
      </main>
    );
  }

  if (!portfolio || !metrics || !snapshot || !allocation) {
    return (
      <main className="min-h-screen bg-background p-10 text-on-surface">
        <div className="mx-auto max-w-[1100px] glass-panel p-10 text-error">Report data is unavailable.</div>
      </main>
    );
  }

  return (
    <main data-report-ready="true" className="report-page min-h-screen bg-background text-on-surface">
      <div id="report-content" className="mx-auto max-w-[1100px] px-8 py-10 bg-background text-on-surface">
        {/* PAGE 1: Core Metrics & Returns Chart */}
        <div className="flex flex-col gap-8">
          <header className="report-section flex items-start justify-between gap-8 border-b border-border pb-8">
            <div>
              <p className="font-label-caps text-label-caps text-primary uppercase tracking-[0.2em]">QuantVault Institutional Report</p>
              <h1 className="mt-3 font-display-lg text-display-lg">{portfolio.name}</h1>
              <p className="mt-4 text-on-surface-variant">Generated {generatedAt} · Snapshot {snapshot.date || "not computed"}</p>
            </div>
            <div className="text-right flex flex-col items-end gap-4">
              <div>
                <p className="font-label-caps text-label-caps text-on-surface-variant">Portfolio ID</p>
                <p className="mt-2 max-w-[280px] break-all font-data-mono text-sm">{portfolio.id}</p>
              </div>
              <button 
                onClick={handleDownload}
                disabled={isDownloading}
                data-html2canvas-ignore="true"
                className="print:hidden flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-caps text-label-caps hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {isDownloading ? "Generating..." : "Download Report"}
              </button>
            </div>
          </header>

          <section className="report-section grid grid-cols-4 gap-4">
            {[
              ["Annualized Return", formatPct(snapshot.annualized_return)],
              ["Volatility", formatPct(snapshot.portfolio_volatility)],
              ["Max Drawdown", formatPct(snapshot.max_drawdown)],
              ["Sharpe Ratio", formatNumber(snapshot.sharpe_ratio)],
            ].map(([label, value]) => (
              <div key={label} className="glass-panel p-5">
                <p className="font-label-caps text-label-caps text-on-surface-variant">{label}</p>
                <p className="mt-4 font-data-mono text-[24px] text-primary">{value}</p>
              </div>
            ))}
          </section>

          <section className="report-section grid grid-cols-2 gap-4">
            <div className="glass-panel p-5">
              <p className="font-label-caps text-label-caps text-on-surface-variant">Relative Alpha</p>
              <p className="mt-4 font-data-mono text-[24px] text-primary">{formatPct(latestAlpha)}</p>
            </div>
            <div className="glass-panel p-5">
              <p className="font-label-caps text-label-caps text-on-surface-variant">Tracking Difference</p>
              <p className="mt-4 font-data-mono text-[24px] text-primary">{formatPct(latestTracking)}</p>
            </div>
          </section>

          <section className="report-section glass-panel p-8">
            <h2 className="font-headline-md text-headline-md mb-6">Performance vs Benchmark</h2>
            <ReturnsChart metrics={metrics} />
          </section>
        </div>

        {/* PAGE BREAK 1 */}
        <div className="pdf-page-break" />

        {/* PAGE 2: Risk Trends & Asset Allocation */}
        <div className="flex flex-col gap-8 mt-10 pdf-export-active:mt-0 pdf-export-active:pt-4">
          <div className="pdf-export-only justify-between items-center border-b border-border pb-2 text-on-surface-variant font-label-caps text-[10px] uppercase tracking-widest">
            <span>QuantVault Institutional Report · {portfolio.name}</span>
            <span>Page 2</span>
          </div>

          <section className="report-section grid grid-cols-2 gap-6">
            <div className="glass-panel p-8">
              <h2 className="font-headline-md text-headline-md mb-6">Volatility Trend</h2>
              <VolatilityChart metrics={metrics} selectedRange={selectedRange} onRangeChange={() => undefined} showRangeControls={false} />
            </div>
            <div className="glass-panel p-8">
              <h2 className="font-headline-md text-headline-md mb-6">Drawdown Analytics</h2>
              <DrawdownChart metrics={metrics} />
            </div>
          </section>

          <section className="report-section">
            <AllocationSummary allocation={allocation} assets={portfolio.assets} />
          </section>
        </div>

        {/* PAGE BREAK 2 */}
        <div className="pdf-page-break" />

        {/* PAGE 3: Sharpe Table & Correlation Heatmap */}
        <div className="flex flex-col gap-8 mt-10 pdf-export-active:mt-0 pdf-export-active:pt-4">
          <div className="pdf-export-only justify-between items-center border-b border-border pb-2 text-on-surface-variant font-label-caps text-[10px] uppercase tracking-widest">
            <span>QuantVault Institutional Report · {portfolio.name}</span>
            <span>Page 3</span>
          </div>

          <section className="report-section grid grid-cols-2 gap-6">
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
