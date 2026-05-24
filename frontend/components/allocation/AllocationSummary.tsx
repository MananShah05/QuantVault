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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none font-sans text-[var(--text-secondary)]">
      {/* Diversification Index Card */}
      <section className="bg-surface border border-subtle rounded-lg p-6 flex flex-col justify-between min-h-[220px]">
        <div>
          <p className="font-sans text-[10px] font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase mb-4">Diversification Index</p>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-accent">
              {allocation.diversification_score.toFixed(1)}
            </span>
            <span className="font-mono text-xs text-[var(--text-muted)]">/100</span>
          </div>
          <div className="mt-4 h-1 w-full rounded-none bg-elevated overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, allocation.diversification_score))}%` }}
            />
          </div>
        </div>
        
        <dl className="grid grid-cols-2 gap-4 pt-4 border-t border-subtle/50 text-xs mt-4">
          <div>
            <dt className="font-sans text-[10px] text-[var(--text-muted)] uppercase">Exposure</dt>
            <dd className="mt-1 font-mono text-[13px] text-[var(--text-primary)]">{formatPct(allocation.total_exposure)}</dd>
          </div>
          <div>
            <dt className="font-sans text-[10px] text-[var(--text-muted)] uppercase">Avg. Corr.</dt>
            <dd className="mt-1 font-mono text-[13px] text-[var(--text-primary)]">
              {allocation.intra_portfolio_correlation.toFixed(2)}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="font-sans text-[10px] text-[var(--text-muted)] uppercase">Top Sector</dt>
            <dd className="mt-1 text-[13px] text-[var(--text-primary)] font-medium truncate">{allocation.top_sector}</dd>
          </div>
        </dl>
      </section>

      {/* Sector Concentration Card */}
      <section className="bg-surface border border-subtle rounded-lg p-6 flex flex-col justify-between min-h-[220px]">
        <div>
          <p className="font-sans text-[10px] font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase mb-4">Sector Concentration</p>
          <div className="space-y-4 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
            {allocation.sector_concentration.map((item) => (
              <div key={item.sector} className="space-y-1">
                <div className="flex justify-between gap-4 text-xs">
                  <span className="text-[var(--text-primary)] truncate max-w-[180px]">{item.sector}</span>
                  <span className="font-mono text-[var(--text-secondary)]">{formatPct(item.weight)}</span>
                </div>
                <div className="h-1 w-full bg-elevated rounded-none overflow-hidden">
                  <div className="h-full bg-accent" style={{ width: `${Math.min(item.weight * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Asset Weights Card */}
      <section className="bg-surface border border-subtle rounded-lg p-6 flex flex-col justify-between min-h-[220px]">
        <div>
          <p className="font-sans text-[10px] font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase mb-4">Asset Allocations</p>
          <div className="space-y-3.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
            {weights.map((asset) => (
              <div key={asset.ticker} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-xs text-[var(--text-primary)] font-medium">{asset.label}</p>
                  <p className="truncate font-mono text-[10px] text-[var(--text-muted)]">{asset.ticker} &bull; {asset.sector}</p>
                </div>
                <span className="font-mono text-[13px] text-accent font-semibold">{formatPct(asset.weight)}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-4 text-[9px] font-mono text-[var(--text-muted)] text-right">As of {allocation.as_of_date}</p>
      </section>
    </div>
  );
}
