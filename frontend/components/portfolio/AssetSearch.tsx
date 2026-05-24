"use client";

import { useState } from "react";
import { useAssetSearch } from "@/hooks/usePortfolio";
import { Search, Loader2, Plus } from "lucide-react";

export function AssetSearch({ onAdd }: { onAdd: (asset: { ticker: string; name: string; asset_class: string }) => void }) {
  const [query, setQuery] = useState("");
  const { data, isLoading, isError } = useAssetSearch(query);

  return (
    <div className="relative font-sans text-sm">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-[var(--text-muted)] shrink-0" />
        <input 
          placeholder="Search by ticker (e.g. AAPL, SPY, GLD)..." 
          className="w-full pl-10 pr-10 py-2.5 bg-base border border-default rounded-[6px] text-sm text-[var(--text-primary)] focus:border-accent/40 focus:ring-2 focus:ring-accent-dim outline-none transition-all"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-[var(--text-muted)]" />
        )}
      </div>
      
      {query.length >= 2 && data && !isError && (
        <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-overlay border border-default rounded-lg shadow-2xl z-50">
          <div className="flex items-center justify-between p-2 hover:bg-elevated rounded-md transition-colors">
            <div className="flex flex-col text-left">
              <span className="font-mono font-bold text-sm text-accent">{data.ticker}</span>
              <span className="text-xs text-[var(--text-secondary)] truncate max-w-[200px] sm:max-w-xs">{data.name} &bull; {data.exchange}</span>
            </div>
            <button 
              onClick={() => {
                onAdd({ ticker: data.ticker, name: data.name, asset_class: data.asset_class });
                setQuery("");
              }}
              className="h-8 px-3 bg-accent hover:bg-[#3b7de8] text-white font-sans text-xs font-medium rounded transition-all flex items-center gap-1 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
        </div>
      )}
      
      {query.length >= 2 && isError && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 text-xs text-negative bg-negative/5 border border-negative/20 rounded-lg shadow-2xl z-50 text-left">
          Ticker not found or invalid.
        </div>
      )}
    </div>
  );
}
