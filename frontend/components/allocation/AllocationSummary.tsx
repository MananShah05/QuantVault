"use client";

import { useMemo } from "react";
import { AllocationSummaryResponse, Asset } from "@/types";

const formatPct = (value: number | null | undefined, digits = 1) =>
  value === null || value === undefined ? "N/A" : `${(value * 100).toFixed(digits)}%`;

interface AllocationSummaryProps {
  allocation: AllocationSummaryResponse;
  assets: Asset[];
}

export function AllocationSummary({ allocation, assets }: AllocationSummaryProps) {
  const weights = useMemo(
    () =>
      [...assets]
        .sort((a, b) => b.weight - a.weight)
        .map((asset) => ({
          label: asset.display_name || asset.ticker,
          ticker: asset.ticker,
          weight: asset.weight,
          sector: asset.sector || "Pending sector",
        })),
    [assets],
  );

  return (
    <div className="grid grid-cols-12 gap-gutter-desktop">
      <section className="col-span-12 lg:col-span-4 glass-panel p-8">
        <p className="font-label-caps text-label-caps text-on-surface-variant mb-3">Diversification Score</p>
        <div className="flex items-end gap-3">
          <span className="font-data-mono text-[40px] leading-none text-primary">
            {allocation.diversification_score.toFixed(1)}
          </span>
          <span className="font-label-caps text-label-caps text-on-surface-variant mb-2">/100</span>
        </div>
        <div className="mt-6 h-1.5 w-full rounded-full bg-surface-container-highest overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, allocation.diversification_score))}%` }}
          />
        </div>
        <dl className="mt-8 grid grid-cols-2 gap-5">
          <div>
            <dt className="font-label-caps text-label-caps text-on-surface-variant">Exposure</dt>
            <dd className="mt-2 font-data-mono text-data-mono text-on-surface">{formatPct(allocation.total_exposure)}</dd>
          </div>
          <div>
            <dt className="font-label-caps text-label-caps text-on-surface-variant">Avg. Corr.</dt>
            <dd className="mt-2 font-data-mono text-data-mono text-on-surface">
              {allocation.intra_portfolio_correlation.toFixed(2)}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="font-label-caps text-label-caps text-on-surface-variant">Top Sector</dt>
            <dd className="mt-2 text-on-surface">{allocation.top_sector}</dd>
          </div>
        </dl>
      </section>

      <section className="col-span-12 lg:col-span-4 glass-panel p-8">
        <p className="font-label-caps text-label-caps text-on-surface-variant mb-6">Sector Concentration</p>
        <div className="space-y-5">
          {allocation.sector_concentration.map((item) => (
            <div key={item.sector}>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-on-surface">{item.sector}</span>
                <span className="font-data-mono text-on-surface-variant">{formatPct(item.weight)}</span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${Math.min(item.weight * 100, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="col-span-12 lg:col-span-4 glass-panel p-8">
        <p className="font-label-caps text-label-caps text-on-surface-variant mb-6">Asset Weights</p>
        <div className="space-y-4">
          {weights.map((asset) => (
            <div key={asset.ticker} className="grid grid-cols-[1fr_auto] gap-4 items-center">
              <div className="min-w-0">
                <p className="truncate text-sm text-on-surface">{asset.label}</p>
                <p className="truncate text-xs text-on-surface-variant">{asset.ticker} · {asset.sector}</p>
              </div>
              <span className="font-data-mono text-sm text-primary">{formatPct(asset.weight)}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 font-label-caps text-label-caps text-on-surface-variant">As of {allocation.as_of_date}</p>
      </section>
    </div>
  );
}
