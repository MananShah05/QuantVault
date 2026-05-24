"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCreatePortfolio } from "@/hooks/usePortfolio";
import { AssetSearch } from "./AssetSearch";
import { Loader2, Zap, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MOTION } from "@/lib/motion";

interface AssetInput {
  ticker: string;
  name?: string;
  asset_class?: string;
  weight: number;
}

export function PortfolioBuilder() {
  const router = useRouter();
  const [name, setName] = useState("Global Alpha Aggregator");
  const [assets, setAssets] = useState<AssetInput[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logs, setLogs] = useState<Array<{ time: string; msg: string }>>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const { mutateAsync: createPortfolio } = useCreatePortfolio();

  // Initialize logs
  useEffect(() => {
    setLogs([
      { time: new Date().toLocaleTimeString(), msg: "Terminal session secure. Risk Engine initialized." }
    ]);
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg }]);
  };

  // Scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const totalWeight = assets.reduce((sum, a) => sum + a.weight, 0);
  const isWeightValid = totalWeight === 100;
  const isNameValid = name.length >= 3;
  const isValid = isWeightValid && isNameValid && assets.length >= 2 && assets.length <= 10;

  // HHI Concentration calculation
  const hhi = assets.reduce((sum, a) => sum + (a.weight) ** 2, 0);
  const concentration = 
    assets.length === 0 
      ? "PENDING ASSETS" 
      : hhi < 2500 
        ? "DIVERSIFIED" 
        : hhi < 5000 
          ? "BALANCED" 
          : "CONCENTRATED";

  const concentrationColor = 
    concentration === "DIVERSIFIED" 
      ? "text-positive" 
      : concentration === "BALANCED" 
        ? "text-warning" 
        : "text-negative";

  const assetColors = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)", "var(--series-5)"];

  const handleAddAsset = (asset: { ticker: string; name: string; asset_class: string }) => {
    if (assets.find(a => a.ticker === asset.ticker)) return;
    if (assets.length >= 10) return;
    
    const remaining = Math.max(0, 100 - totalWeight);
    setAssets([...assets, { ...asset, weight: remaining }]);
    addLog(`Added instrument ${asset.ticker} with target weight ${remaining}%`);
  };

  const handleUpdateWeight = (ticker: string, weight: number) => {
    const cleanedVal = Math.min(100, Math.max(0, weight));
    setAssets(assets.map(a => a.ticker === ticker ? { ...a, weight: cleanedVal } : a));
  };

  const handleRemoveAsset = (ticker: string) => {
    setAssets(assets.filter(a => a.ticker !== ticker));
    addLog(`Removed instrument ${ticker}`);
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    addLog("Executing trades. Storing portfolio structure in Supabase...");
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
      addLog("Portfolio registered successfully. Initializing FastAPI quantitative metrics engine...");
      
      const { api } = await import("@/lib/api");
      await api.post(`/api/portfolios/${res.id}/compute`);
      addLog("Calculations finalized. Redirecting to Analytics Workspace.");
      
      router.push(`/portfolio/${res.id}`);
    } catch (err) {
      console.error(err);
      addLog(`Execution error: ${err instanceof Error ? err.message : "Computation failed"}`);
      setIsSubmitting(false);
    }
  };

  // Pure SVG donut configuration
  const radius = 50;
  const circ = 2 * Math.PI * radius; // ~314.16
  let accumulatedWeight = 0;
  const segments = assets.map((asset, i) => {
    const segmentLength = (asset.weight / 100) * circ;
    const strokeOffset = circ - (accumulatedWeight / 100) * circ;
    accumulatedWeight += asset.weight;
    return {
      ticker: asset.ticker,
      weight: asset.weight,
      color: assetColors[i % assetColors.length],
      segmentLength,
      strokeOffset
    };
  });

  return (
    <div className="w-full select-none font-sans text-[var(--text-secondary)]">
      <motion.div 
        variants={MOTION.pageContainer}
        initial="hidden"
        animate="show"
        className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-subtle pb-6 gap-4"
      >
        <motion.div variants={MOTION.itemUp}>
          <h1 className="font-serif italic text-[32px] text-[var(--text-primary)]">New Portfolio</h1>
          <p className="text-xs mt-1 text-[var(--text-secondary)]">Configure asset parameters and target allocations.</p>
        </motion.div>
        
        <motion.div variants={MOTION.itemUp} className="flex gap-2">
          <button 
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className={`h-10 px-6 rounded-[6px] font-sans text-[13px] font-medium flex items-center gap-2 transition-all ${
              isValid && !isSubmitting 
                ? "bg-accent hover:bg-[#3b7de8] text-white" 
                : "bg-surface border border-subtle text-[var(--text-muted)] cursor-not-allowed opacity-40"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin w-4 h-4 text-accent" />
                <span className="font-mono text-xs text-accent">COMPUTING METRICS...</span>
              </>
            ) : (
              <>
                <Zap size={14} className="fill-current" />
                <span>Execute Trade</span>
              </>
            )}
          </button>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Left Column: Configuration & Search */}
        <motion.div variants={MOTION.itemUp} className="space-y-6">
          <div className="bg-surface border border-subtle rounded-lg p-6 space-y-6">
            {/* Portfolio Name Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-sans font-medium tracking-[0.15em] text-[var(--text-muted)] uppercase">
                PORTFOLIO NAME
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-base border border-default rounded-[6px] text-sm text-[var(--text-primary)] focus:border-accent/40 focus:ring-2 focus:ring-accent-dim outline-none transition-all"
                placeholder="Portfolio Title"
              />
            </div>

            {/* Asset Search */}
            <div className="space-y-2">
              <label className="text-[10px] font-sans font-medium tracking-[0.15em] text-[var(--text-muted)] uppercase">
                ASSET SEARCH
              </label>
              <AssetSearch onAdd={handleAddAsset} />
            </div>

            {/* Selected Assets Rows */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-subtle">
                <span className="text-[10px] font-sans font-medium tracking-[0.15em] text-[var(--text-muted)] uppercase">
                  SELECTED ASSETS ({assets.length} / 10)
                </span>
              </div>
              
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                {assets.map((asset, i) => {
                  const color = assetColors[i % assetColors.length];
                  return (
                    <div 
                      key={asset.ticker} 
                      className="flex items-center justify-between p-3 bg-base border border-subtle rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-1.5 h-6 rounded-none shrink-0" 
                          style={{ backgroundColor: color }}
                        />
                        <div>
                          <p className="font-mono text-[13px] font-semibold text-accent">{asset.ticker}</p>
                          <p className="text-[11px] text-[var(--text-muted)] truncate max-w-[180px] md:max-w-none">
                            {asset.name || asset.ticker}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateWeight(asset.ticker, asset.weight - 1)}
                            className="w-7 h-7 bg-elevated border border-default rounded flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                          >
                            −
                          </button>
                          
                          <input
                            type="number"
                            value={asset.weight}
                            onChange={(e) => handleUpdateWeight(asset.ticker, parseFloat(e.target.value) || 0)}
                            className="w-12 h-7 bg-base text-center font-mono text-[13px] text-[var(--text-primary)] focus:border-accent/40 focus:ring-0 outline-none border border-default rounded"
                          />
                          
                          <button
                            type="button"
                            onClick={() => handleUpdateWeight(asset.ticker, asset.weight + 1)}
                            className="w-7 h-7 bg-elevated border border-default rounded flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                          >
                            +
                          </button>
                        </div>

                        <button 
                          onClick={() => handleRemoveAsset(asset.ticker)}
                          className="text-[var(--text-muted)] hover:text-[#f87171] transition-colors p-1"
                          title="Remove asset"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {assets.length === 0 && (
                  <div className="py-8 text-center text-xs text-[var(--text-muted)] border border-dashed border-default rounded-lg">
                    Search and select assets above to configure allocation.
                  </div>
                )}
              </div>
            </div>

            {/* Weight Total Progress Bar */}
            <div className="space-y-2 pt-2 border-t border-subtle">
              <div className="flex justify-between items-center text-xs font-mono">
                <span>TOTAL WEIGHT</span>
                <span className={totalWeight > 100 ? "text-negative" : "text-positive"}>
                  {totalWeight}%
                </span>
              </div>
              <div className="h-1 bg-elevated rounded-none overflow-hidden w-full">
                <div
                  className={`h-full transition-all duration-200 ${totalWeight > 100 ? "bg-negative" : "bg-positive"}`}
                  style={{ width: `${Math.min(totalWeight, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
                <span>Allocated: {totalWeight}%</span>
                <span>Remaining: {Math.max(0, 100 - totalWeight)}%</span>
              </div>
            </div>
          </div>

          {/* Emulated Quantitative Log Terminal */}
          <div className="bg-base border border-subtle rounded-lg p-4 space-y-2 font-mono text-[11px]">
            <p className="text-[10px] font-sans font-semibold text-[var(--text-muted)] tracking-widest uppercase">
              SYSTEM LOG & VERIFICATION
            </p>
            <div className="h-[100px] overflow-y-auto pr-1 custom-scrollbar space-y-1.5 pt-2 border-t border-subtle/50">
              <AnimatePresence initial={false}>
                {logs.map((log, i) => (
                  <motion.p
                    key={i}
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="leading-relaxed"
                  >
                    <span className="text-accent">[{log.time}]</span>{" "}
                    <span className="text-[var(--text-secondary)]">{log.msg}</span>
                  </motion.p>
                ))}
              </AnimatePresence>
              <div ref={logsEndRef} />
            </div>
          </div>
        </motion.div>

        {/* Right Column: Live Donut Preview & Concentration */}
        <motion.div variants={MOTION.itemUp} className="space-y-6">
          <div className="bg-surface border border-subtle rounded-lg p-6 space-y-6 text-center">
            <h3 className="text-[10px] font-sans font-medium tracking-[0.15em] text-[var(--text-muted)] uppercase text-left">
              ALLOCATION PREVIEW
            </h3>
            
            {/* Pure SVG Donut Chart */}
            <div className="flex items-center justify-center py-4">
              <div className="relative w-[160px] h-[160px] flex items-center justify-center">
                <svg width="160" height="160" viewBox="0 0 120 120" className="-rotate-90">
                  {/* Background Circle */}
                  <circle cx="60" cy="60" r="50" fill="none" stroke="var(--bg-elevated)" strokeWidth="10" />
                  {/* Segments */}
                  {segments.map((seg) => (
                    <circle
                      key={seg.ticker}
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="10"
                      strokeDasharray={`${seg.segmentLength} ${circ - seg.segmentLength}`}
                      strokeDashoffset={seg.strokeOffset}
                      strokeLinecap="butt"
                      style={{ transition: "stroke-dasharray 300ms ease, stroke-dashoffset 300ms ease" }}
                    />
                  ))}
                </svg>
                {/* Center text overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-2xl font-bold text-[var(--text-primary)]">{totalWeight}%</span>
                  <span className="font-sans text-[9px] font-medium tracking-widest text-[var(--text-muted)] uppercase">
                    ALLOCATED
                  </span>
                </div>
              </div>
            </div>

            {/* Asset Breakdown list */}
            <div className="space-y-3.5 text-left pt-2 border-t border-subtle">
              <span className="text-[10px] font-sans font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase block mb-1">
                ASSET BREAKDOWN
              </span>
              
              <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                {assets.map((asset, i) => {
                  const color = assetColors[i % assetColors.length];
                  return (
                    <div key={asset.ticker} className="flex items-center justify-between text-xs">
                      <span className="font-mono font-medium text-[var(--text-primary)] w-12 shrink-0">{asset.ticker}</span>
                      <div className="flex-1 mx-3 h-1 bg-elevated rounded-none overflow-hidden relative">
                        <div
                          className="h-full rounded-none"
                          style={{ width: `${asset.weight}%`, backgroundColor: color }}
                        />
                      </div>
                      <span className="font-mono text-[var(--text-secondary)] w-8 text-right shrink-0">{asset.weight}%</span>
                    </div>
                  );
                })}
                {assets.length === 0 && (
                  <p className="text-xs text-[var(--text-muted)] text-center py-2">Add assets to view segments.</p>
                )}
              </div>
            </div>

            {/* Concentration Score */}
            <div className="pt-4 border-t border-subtle text-left space-y-1">
              <span className="text-[10px] font-sans font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase block">
                CONCENTRATION INDEX
              </span>
              <p className={`font-mono text-lg font-bold ${concentrationColor}`}>
                {concentration}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] leading-normal font-sans pt-1">
                Calculated dynamically using the Herfindahl-Hirschman index of weight distributions.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
