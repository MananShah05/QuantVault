"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreatePortfolio } from "@/hooks/usePortfolio";
import { AssetSearch } from "./AssetSearch";
import { Loader2 } from "lucide-react";

export function PortfolioBuilder() {
  const router = useRouter();
  const [name, setName] = useState("Global Alpha Aggregator");
  const [assets, setAssets] = useState<Array<{ticker: string, name?: string, asset_class?: string, weight: number}>>([]);
  
  const { mutateAsync: createPortfolio } = useCreatePortfolio();

  const totalWeight = assets.reduce((sum, a) => sum + a.weight, 0);
  const isWeightValid = totalWeight === 100;
  const isNameValid = name.length >= 3;
  const isValid = isWeightValid && isNameValid && assets.length >= 2 && assets.length <= 10;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const assetClassWeights = assets.reduce<Record<string, number>>((acc, asset) => {
    const key = (asset.asset_class || "equity").toUpperCase();
    acc[key] = (acc[key] || 0) + asset.weight;
    return acc;
  }, {});

  const handleAddAsset = (asset: { ticker: string; name: string; asset_class: string }) => {
    if (assets.find(a => a.ticker === asset.ticker)) return;
    if (assets.length >= 10) return;
    
    const remaining = Math.max(0, 100 - totalWeight);
    setAssets([...assets, { ...asset, weight: remaining }]);
  };

  const handleUpdateWeight = (ticker: string, weight: number) => {
    setAssets(assets.map(a => a.ticker === ticker ? { ...a, weight } : a));
  };

  const handleRemoveAsset = (ticker: string) => {
    setAssets(assets.filter(a => a.ticker !== ticker));
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        assets: assets.map(a => ({
          ticker: a.ticker,
          weight: a.weight / 100,
          asset_class: a.asset_class || "equity"
        }))
      };
      const res = await createPortfolio(payload);
      
      const { api } = await import("@/lib/api");
      await api.post(`/api/portfolios/${res.id}/compute`);
      
      router.push(`/portfolio/${res.id}`);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-container-max mx-auto px-margin-desktop py-12 -mt-10">
      <header className="mb-12">
        <div className="flex items-end justify-between border-b border-border pb-6">
          <div>
            <span className="font-label-caps text-label-caps text-primary mb-2 block uppercase tracking-[0.25em]">Portfolio Creation</span>
            <input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-transparent border-b border-transparent focus:border-primary focus:ring-0 font-headline-lg text-headline-lg outline-none w-full"
              placeholder="Portfolio Name"
            />
          </div>
          <div className="flex gap-4">
            <button className="border border-outline px-6 py-2 font-label-caps text-label-caps text-on-surface hover:bg-accent transition-all">SAVE DRAFT</button>
            <button 
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              className={`px-8 py-2 font-label-caps text-label-caps transition-all ${isValid && !isSubmitting ? 'bg-primary text-on-primary hover:bg-primary-container' : 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed'}`}
            >
              {isSubmitting ? <Loader2 className="animate-spin inline-block mr-2 w-4 h-4" /> : null}
              EXECUTE TRADE
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-start">
        <section className="lg:col-span-7 space-y-8">
          <div className="glass-panel p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-label-caps text-label-caps text-secondary tracking-widest">ASSET SEARCH & SELECTION</h3>
              <span className="text-xs font-data-mono text-primary px-2 py-1 bg-primary/10 border border-primary/20">LIVE DATA CONNECTED</span>
            </div>
            
            <div className="space-y-6">
              {/* Uses the existing AssetSearch component but styles should cascade if possible, or we wrap it */}
              <div className="relative group w-full">
                 <AssetSearch onAdd={handleAddAsset} />
              </div>
 
              <div className="space-y-4 pt-6 max-h-[500px] overflow-y-auto custom-scrollbar">
                {assets.map(asset => (
                  <div key={asset.ticker} className="flex items-center justify-between p-4 bg-muted/40 border border-border hover:border-border/80 transition-all rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-surface-container-highest flex items-center justify-center font-bold text-primary border border-primary/20">
                        {asset.ticker.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-body-md font-semibold">{asset.name || asset.ticker}</p>
                        <p className="text-xs font-data-mono text-on-surface-variant uppercase">{asset.asset_class || 'EQUITY'} | MARKET</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-label-caps text-on-surface-variant mb-1">ALLOCATION %</span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleUpdateWeight(asset.ticker, Math.max(0, asset.weight - 1))}
                            className="w-6 h-6 border border-border flex items-center justify-center hover:bg-primary hover:text-black transition-colors rounded"
                          >
                            -
                          </button>
                          <input 
                            className="w-16 bg-transparent border-none text-right font-data-mono text-primary p-0 focus:ring-0 outline-none font-bold" 
                            type="number" 
                            value={asset.weight}
                            onChange={(e) => handleUpdateWeight(asset.ticker, parseFloat(e.target.value) || 0)}
                          />
                          <button 
                            onClick={() => handleUpdateWeight(asset.ticker, asset.weight + 1)}
                            className="w-6 h-6 border border-border flex items-center justify-center hover:bg-primary hover:text-black transition-colors rounded"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <button onClick={() => handleRemoveAsset(asset.ticker)} className="text-on-surface-variant/40 hover:text-error transition-colors">
                        <span className="material-symbols-outlined text-xl">close</span>
                      </button>
                    </div>
                  </div>
                ))}

                {assets.length === 0 && (
                  <div className="p-8 text-center text-on-surface-variant border border-dashed border-border rounded-lg">
                    Search and select an asset to begin allocation.
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="glass-panel p-8">
            <h3 className="font-label-caps text-label-caps text-secondary tracking-widest mb-6">INTRA-PORTFOLIO CORRELATION</h3>
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-on-surface-variant">
              Correlation matrix is generated from live market history after execution.
            </div>
          </div>
        </section>

        <section className="lg:col-span-5 space-y-8 lg:sticky lg:top-32">
          <div className="glass-panel overflow-hidden">
            <div className="bg-primary/5 p-8 border-b border-border">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-label-caps text-label-caps text-primary tracking-widest mb-1">TOTAL EXPOSURE</h3>
                  <p className="font-display-lg text-display-lg">{totalWeight}%</p>
                </div>
                <span className="material-symbols-outlined text-primary text-4xl" data-weight="fill">account_balance_wallet</span>
              </div>
              <div className="w-full bg-muted h-1.5 relative rounded-full overflow-hidden">
                <div className={`absolute left-0 top-0 h-full ${totalWeight === 100 ? 'bg-primary' : totalWeight > 100 ? 'bg-error' : 'bg-primary/50'}`} style={{ width: `${Math.min(totalWeight, 100)}%` }}></div>
              </div>
              <div className="flex justify-between mt-3">
                <span className="text-xs font-data-mono text-on-surface-variant">Allocated: {totalWeight}%</span>
                <span className="text-xs font-data-mono text-on-surface-variant">Remaining: {Math.max(0, 100 - totalWeight)}%</span>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <span className="font-label-caps text-label-caps text-on-surface-variant">VALIDATION STATUS</span>
                <div className={`flex items-center gap-2 ${isWeightValid ? 'text-primary' : 'text-error'}`}>
                  <span className="material-symbols-outlined text-sm">{isWeightValid ? 'check_circle' : 'error'}</span>
                  <span className="font-data-mono text-xs">{isWeightValid ? 'FULLY COMPLIANT' : 'INVALID WEIGHTS'}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <span className="font-label-caps text-[10px] text-on-surface-variant block mb-1">ASSET COUNT</span>
                  <span className="font-data-mono text-lg text-on-surface font-semibold">{assets.length}</span>
                </div>
                <div>
                  <span className="font-label-caps text-[10px] text-on-surface-variant block mb-1">WEIGHT STATUS</span>
                  <span className="font-data-mono text-lg text-on-surface font-semibold">{isWeightValid ? "Ready" : "Pending"}</span>
                </div>
                <div>
                  <span className="font-label-caps text-[10px] text-on-surface-variant block mb-1">RISK METRICS</span>
                  <span className="font-data-mono text-lg text-on-surface font-semibold">Post-compute</span>
                </div>
                <div>
                  <span className="font-label-caps text-[10px] text-on-surface-variant block mb-1">SNAPSHOT</span>
                  <span className="font-data-mono text-lg text-primary font-bold">Live API</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-8 relative min-h-[300px] flex flex-col justify-between">
            <h3 className="font-label-caps text-label-caps text-secondary tracking-widest mb-4">ASSET CLASS CONCENTRATION</h3>
            <div className="flex-1 flex items-center justify-center py-6">
              <div className="relative w-48 h-48 border-[12px] border-muted rounded-full flex items-center justify-center">
                <div className="text-center">
                  <p className="font-data-mono text-2xl font-bold">{totalWeight}%</p>
                  <p className="font-label-caps text-[10px] text-on-surface-variant">ALLOCATED</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {Object.entries(assetClassWeights).map(([assetClass, weight], i) => (
                <div key={assetClass} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 ${i % 2 === 0 ? 'bg-primary' : 'bg-secondary'}`}></div>
                    <span className="text-xs font-body-md text-on-surface-variant">{assetClass}</span>
                  </div>
                  <span className="font-data-mono text-xs font-semibold">{weight}%</span>
                </div>
              ))}
              {assets.length === 0 && (
                <p className="text-xs text-on-surface-variant text-center">Add assets to see concentration.</p>
              )}
            </div>
          </div>
        </section>
      </div>
      
      <footer className="mt-12 glass-panel p-6">
        <div className="flex items-center gap-4 mb-4 border-b border-border pb-4">
          <span className="material-symbols-outlined text-primary text-sm">terminal</span>
          <span className="font-label-caps text-label-caps tracking-widest text-secondary">SYSTEM LOG & VALIDATION</span>
        </div>
        <div className="font-data-mono text-xs space-y-2 opacity-60">
          <p><span className="text-primary">[14:22:01]</span> System initialized and ready for inputs.</p>
          {assets.map(a => (
            <p key={a.ticker}><span className="text-primary">[{new Date().toLocaleTimeString()}]</span> Added {a.ticker} at {a.weight}% allocation.</p>
          ))}
          {!isWeightValid && assets.length > 0 && (
            <div className="flex items-center gap-2 animate-pulse">
              <span className="w-1.5 h-3 bg-error"></span>
              <span className="text-error">Weights sum to {totalWeight}%. Must equal 100%.</span>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
