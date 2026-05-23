"use client";

import { useState } from "react";
import { useAssetSearch } from "@/hooks/usePortfolio";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Plus } from "lucide-react";

export function AssetSearch({ onAdd }: { onAdd: (asset: { ticker: string; name: string; asset_class: string }) => void }) {
  const [query, setQuery] = useState("");
  const { data, isLoading, isError } = useAssetSearch(query);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input 
          placeholder="Search by ticker (e.g. AAPL, SPY)..." 
          className="pl-10 bg-transparent border-border"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {isLoading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>
      
      {query.length >= 2 && data && !isError && (
        <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-popover text-popover-foreground border border-border rounded-lg shadow-xl z-50">
          <div className="flex items-center justify-between p-2 hover:bg-accent rounded-md transition-colors">
            <div className="flex flex-col">
              <span className="font-bold text-sm">{data.ticker}</span>
              <span className="text-xs text-muted-foreground">{data.name} &bull; {data.exchange}</span>
            </div>
            <Button size="sm" variant="secondary" onClick={() => {
              onAdd({ ticker: data.ticker, name: data.name, asset_class: data.asset_class });
              setQuery("");
            }}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </div>
      )}
      {query.length >= 2 && isError && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-lg shadow-xl z-50">
          Ticker not found or invalid.
        </div>
      )}
    </div>
  );
}
