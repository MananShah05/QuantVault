"use client";

import { useState } from "react";
import { SnapshotResponse, Asset } from "@/types";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type SortField = "ticker" | "ann_ret" | "vol" | "sharpe" | "dd";
type SortOrder = "asc" | "desc";

export function SharpeTable({ snapshot, assets }: { snapshot: SnapshotResponse, assets: Asset[] }) {
  const [sortField, setSortField] = useState<SortField>("sharpe");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const data = assets.map(a => {
    const stats = snapshot.per_asset?.[a.ticker];
    return {
      ticker: a.ticker,
      ann_ret: stats?.annualized_return ?? null,
      vol: stats?.volatility ?? null,
      sharpe: stats?.sharpe ?? null,
      dd: stats?.max_drawdown ?? null,
    };
  });

  data.sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    
    if (valA === null) valA = -Infinity;
    if (valB === null) valB = -Infinity;
    
    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const formatPct = (val: number | null) => val !== null ? `${(val * 100).toFixed(2)}%` : "N/A";
  const formatNum = (val: number | null) => val !== null ? val.toFixed(2) : "N/A";

  const getReturnColor = (val: number | null) => val && val >= 0 ? "text-positive" : "text-negative";
  const getSharpeColor = (val: number | null) => val && val > 1 ? "text-positive" : (val && val > 0.5 ? "text-warning" : "text-negative");

  const SortHeader = ({ field, label, right = false }: { field: SortField, label: string, right?: boolean }) => {
    const isSorted = sortField === field;
    return (
      <th 
        className={`px-4 py-2.5 font-sans text-[10px] font-medium uppercase tracking-[0.1em] cursor-pointer transition-colors ${
          isSorted ? "text-accent" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        } ${right ? "text-right" : "text-left"}`} 
        onClick={() => handleSort(field)}
      >
        <div className={`flex items-center gap-1 ${right ? "justify-end" : "justify-start"}`}>
          <span>{label}</span>
          {isSorted ? (
            sortOrder === "asc" ? <ArrowUp size={10} className="text-accent" /> : <ArrowDown size={10} className="text-accent" />
          ) : (
            <ArrowUpDown size={10} className="opacity-40" />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="bg-surface border border-subtle elev-1 rounded-lg p-5 flex flex-col justify-between h-full select-none w-full">
      <div>
        <span className="text-[10px] font-sans font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase block mb-4">
          RISK & RETURN ATTRIBUTION
        </span>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-subtle">
                <SortHeader field="ticker" label="Asset" />
                <SortHeader field="ann_ret" label="Ann. Return" right />
                <SortHeader field="vol" label="Volatility" right />
                <SortHeader field="sharpe" label="Sharpe" right />
                <SortHeader field="dd" label="Max DD" right />
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle/50">
              <AnimatePresence>
                {data.map((row) => (
                  <motion.tr 
                    key={row.ticker} 
                    layout
                    className="hover:bg-elevated transition-colors duration-100 group"
                  >
                    <td className="px-4 py-3 font-mono text-[13px] text-[var(--text-primary)] font-medium">{row.ticker}</td>
                    <td className={`px-4 py-3 text-right font-mono text-[13px] ${getReturnColor(row.ann_ret)}`}>{formatPct(row.ann_ret)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[13px] text-[var(--text-secondary)]">{formatPct(row.vol)}</td>
                    <td className={`px-4 py-3 text-right font-mono text-[13px] font-semibold ${getSharpeColor(row.sharpe)}`}>{formatNum(row.sharpe)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[13px] text-negative font-medium">{formatPct(row.dd)}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
