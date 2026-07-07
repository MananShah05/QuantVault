"use client";

import { useState } from "react";
import { Asset } from "@/types";

interface Props {
  matrix: Record<string, Record<string, number>> | null;
  assets: Asset[];
}

interface HoverState {
  row: string;
  col: string;
  value: number;
  x: number;
  y: number;
}

export function CorrelationHeatmap({ matrix, assets }: Props) {
  const [hover, setHover] = useState<HoverState | null>(null);

  if (!matrix) {
    return (
      <div className="bg-surface border border-subtle elev-1 rounded-lg p-6 text-center select-none font-sans">
        <span className="text-[10px] font-sans font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase block mb-4 text-left">
          CORRELATION MATRIX
        </span>
        <p className="text-xs text-[var(--text-muted)] py-8">Correlation matrix is not available.</p>
      </div>
    );
  }

  const tickers = assets.map((a) => a.ticker);
  const validTickers = tickers.filter((t) => t in matrix);

  if (validTickers.length === 0) {
    return (
      <div className="bg-surface border border-subtle elev-1 rounded-lg p-6 text-center select-none font-sans">
        <span className="text-[10px] font-sans font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase block mb-4 text-left">
          CROSS-ASSET CORRELATION MATRIX
        </span>
        <p className="text-xs text-[var(--text-muted)] py-8">No correlation data found for the current assets.</p>
      </div>
    );
  }

  // Smooth OKLCH interpolation. Positive correlation → signal cyan,
  // negative → semantic red. Chroma + alpha scale with magnitude so
  // weak relationships fade toward the surface and strong ones saturate.
  const getCellColor = (value: number, isDiagonal: boolean): React.CSSProperties => {
    if (isDiagonal) {
      return {
        backgroundColor: "var(--bg-elevated)",
        color: "var(--text-muted)",
      };
    }
    const absVal = Math.min(Math.abs(value), 1);
    const alpha = (0.06 + absVal * 0.72).toFixed(3);
    if (value >= 0) {
      const chroma = (0.04 + absVal * 0.11).toFixed(3);
      return {
        backgroundColor: `oklch(0.78 ${chroma} 195 / ${alpha})`,
        color: absVal > 0.55 ? "var(--accent-foreground)" : "var(--text-primary)",
      };
    }
    const chroma = (0.05 + absVal * 0.13).toFixed(3);
    return {
      backgroundColor: `oklch(0.70 ${chroma} 22 / ${alpha})`,
      color: absVal > 0.5 ? "#ffffff" : "var(--text-primary)",
    };
  };

  const cellSize = "80px";
  const isHovered = (row: string, col: string) =>
    hover?.row === row && hover?.col === col;
  const isAxisHighlighted = (row: string, col: string) =>
    hover && !isHovered(row, col) && (hover.row === row || hover.col === col);

  return (
    <div className="bg-surface border border-subtle elev-1 rounded-lg p-5 select-none w-full relative">
      <span className="text-[10px] font-sans font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase block mb-4">
        CROSS-ASSET CORRELATION MATRIX
      </span>
      <div className="overflow-x-auto w-full pt-2">
        <table className="border-collapse" style={{ width: "auto" }}>
          <thead>
            <tr>
              <th
                className="bg-surface border-b border-r border-subtle"
                style={{ width: cellSize, minWidth: cellSize }}
              />
              {validTickers.map((t) => (
                <th
                  key={t}
                  className={`bg-surface border-b border-subtle font-mono text-[11px] text-center font-medium tabular-nums transition-colors ${
                    hover?.col === t ? "text-accent" : "text-[var(--text-muted)]"
                  }`}
                  style={{ width: cellSize, minWidth: cellSize, padding: "10px 8px" }}
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {validTickers.map((rowTicker) => (
              <tr key={rowTicker}>
                <th
                  className={`bg-surface font-mono text-[11px] text-left font-medium border-r border-b border-subtle transition-colors ${
                    hover?.row === rowTicker ? "text-accent" : "text-[var(--text-muted)]"
                  }`}
                  style={{ width: cellSize, minWidth: cellSize, padding: "10px 12px" }}
                >
                  {rowTicker}
                </th>
                {validTickers.map((colTicker) => {
                  const isDiagonal = rowTicker === colTicker;
                  const val = matrix[rowTicker]?.[colTicker] ?? 0;
                  const colors = getCellColor(val, isDiagonal);
                  const hovered = isHovered(rowTicker, colTicker);
                  const axis = isAxisHighlighted(rowTicker, colTicker);
                  return (
                    <td
                      key={colTicker}
                      className="text-center font-mono text-[13px] font-medium border-b border-subtle tabular-nums cursor-default"
                      style={{
                        width: cellSize,
                        minWidth: cellSize,
                        height: "56px",
                        padding: "8px",
                        position: "relative",
                        zIndex: hovered ? 20 : 1,
                        transform: hovered ? "scale(1.08)" : "scale(1)",
                        transition: "transform 220ms cubic-bezier(0.16,1,0.3,1), box-shadow 220ms cubic-bezier(0.16,1,0.3,1), opacity 150ms ease",
                        boxShadow: hovered ? "0 0 0 1px var(--accent-border), var(--shadow-elev)" : "none",
                        opacity: hover && !hovered && !axis ? 0.55 : 1,
                        ...colors,
                      }}
                      onMouseEnter={(e) => {
                        const container = e.currentTarget.closest("div.relative") as HTMLElement | null;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const base = container?.getBoundingClientRect();
                        setHover({
                          row: rowTicker,
                          col: colTicker,
                          value: val,
                          x: rect.left - (base?.left ?? 0) + rect.width / 2,
                          y: rect.top - (base?.top ?? 0),
                        });
                      }}
                      onMouseLeave={() => setHover(null)}
                    >
                      {val.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Floating tooltip */}
      {hover && (
        <div
          className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full"
          style={{ left: hover.x, top: hover.y - 8 }}
        >
          <div className="bg-overlay border border-default rounded-md px-3 py-2 shadow-elev whitespace-nowrap">
            <div className="font-mono text-[11px] text-[var(--text-muted)]">
              {hover.row} <span className="text-[var(--text-secondary)]">×</span> {hover.col}
            </div>
            <div
              className={`font-mono text-[15px] font-semibold tabular-nums ${
                hover.row === hover.col
                  ? "text-[var(--text-secondary)]"
                  : hover.value >= 0
                    ? "text-accent"
                    : "text-negative"
              }`}
            >
              {hover.value >= 0 ? "+" : ""}
              {hover.value.toFixed(3)}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-end gap-4 mt-4 pt-3 border-t border-subtle">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "oklch(0.70 0.15 22 / 0.6)" }} />
          <span className="font-mono text-[10px] text-[var(--text-muted)]">Negative</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-elevated border border-subtle" />
          <span className="font-mono text-[10px] text-[var(--text-muted)]">Diagonal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "oklch(0.78 0.13 195 / 0.6)" }} />
          <span className="font-mono text-[10px] text-[var(--text-muted)]">Positive</span>
        </div>
      </div>
    </div>
  );
}
