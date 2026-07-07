"use client";

import { MetricsResponse } from "@/types";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

// Series colors — driven by theme tokens (OKLCH) for perceptual consistency
const PALETTE = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)", "var(--series-5)"];

const CHART_THEME = {
  background: 'transparent',
  gridColor: 'rgba(255,255,255,0.04)',
  axisColor: 'rgba(255,255,255,0)',
  tickColor: 'var(--text-muted)',
  tickFont: { fontFamily: 'IBM Plex Mono', fontSize: 10 },
  tooltip: {
    contentStyle: {
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderRadius: '6px',
      fontFamily: 'IBM Plex Mono',
      fontSize: '12px',
      padding: '10px 14px',
    },
    labelStyle: { color: '#94a3b8', marginBottom: '6px' },
    itemStyle: { color: 'var(--text-primary)' },
  }
};

interface VolatilityChartProps {
  metrics: MetricsResponse;
  selectedRange: "1M" | "3M" | "6M" | "1Y";
  onRangeChange: (range: "1M" | "3M" | "6M" | "1Y") => void;
  showRangeControls?: boolean;
}

interface ChartDataItem {
  date: string;
  [key: string]: string | number | null;
}

export function VolatilityChart({ metrics, selectedRange, onRangeChange, showRangeControls = true }: VolatilityChartProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const { chartData, tickers } = useMemo(() => {
    const dataMap = new Map<string, ChartDataItem>();

    metrics.portfolio.forEach((p) => {
      dataMap.set(p.date, { date: p.date, Portfolio: p.rolling_vol_30d !== null ? p.rolling_vol_30d * 100 : null });
    });

    Object.entries(metrics.assets).forEach(([ticker, rows]) => {
      rows.forEach((r) => {
        const item = dataMap.get(r.date);
        if (item) {
          item[ticker] = r.rolling_vol_30d !== null ? r.rolling_vol_30d * 100 : null;
        }
      });
    });

    return {
      chartData: Array.from(dataMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      tickers: Object.keys(metrics.assets),
    };
  }, [metrics]);

  const isDark = !mounted || theme === "dark";
  const portfolioColor = "var(--series-portfolio)";
  const gridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";

  // Format date helper (MMM 'YY)
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const m = d.toLocaleDateString('en-US', { month: 'short' });
      const y = d.toLocaleDateString('en-US', { year: '2-digit' });
      return `${m} '${y}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="h-full flex flex-col w-full">
      {showRangeControls && (
        <div className="flex bg-elevated border border-default p-0.5 rounded-md h-8 items-center self-start mb-4">
          {(["1M", "3M", "6M", "1Y"] as const).map(range => (
            <button
              key={range} 
              className={`h-7 px-3 font-mono text-[11px] rounded transition-colors ${
                selectedRange === range 
                  ? "text-accent bg-[var(--accent-dim)] font-semibold" 
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              onClick={() => onRangeChange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      )}
      
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            key={metrics.portfolio_id}
            data={chartData} 
            margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="0" stroke={gridColor} vertical={false} />
            
            <XAxis 
              dataKey="date" 
              stroke={CHART_THEME.tickColor} 
              fontSize={10} 
              fontFamily={CHART_THEME.tickFont.fontFamily}
              tickLine={false} 
              axisLine={false} 
              tickFormatter={formatDate}
              dy={8}
            />
            
            <YAxis 
              stroke={CHART_THEME.tickColor} 
              fontSize={10} 
              fontFamily={CHART_THEME.tickFont.fontFamily}
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(val) => `${val.toFixed(1)}%`}
              orientation="right"
            />
            
            <Tooltip 
              contentStyle={CHART_THEME.tooltip.contentStyle}
              labelStyle={CHART_THEME.tooltip.labelStyle}
              itemStyle={CHART_THEME.tooltip.itemStyle}
              formatter={(value: number) => [`${value.toFixed(2)}%`]}
            />
            
            <Legend 
              verticalAlign="top"
              align="right"
              wrapperStyle={{ 
                fontSize: "12px", 
                fontFamily: "DM Sans", 
                paddingBottom: "15px" 
              }} 
              iconType="circle"
              iconSize={8}
            />

            <ReferenceLine 
              y={20} 
              stroke="var(--warning-dim)" 
              strokeDasharray="4 3" 
              label={{ 
                value: '20% threshold', 
                fill: 'var(--warning)', 
                fontSize: 9, 
                fontFamily: 'IBM Plex Mono', 
                position: 'insideBottomRight' 
              }} 
            />

            {tickers.map((ticker, i) => (
              <Line 
                key={ticker} 
                type="monotone" 
                dataKey={ticker} 
                stroke={PALETTE[i % PALETTE.length]} 
                strokeWidth={1.2} 
                dot={false} 
                activeDot={{ r: 4, strokeWidth: 0, fill: PALETTE[i % PALETTE.length] }}
                isAnimationActive={true}
                animationDuration={700}
                animationEasing="ease-out"
              />
            ))}
            
            <Line 
              type="monotone" 
              dataKey="Portfolio" 
              stroke={portfolioColor} 
              strokeWidth={2} 
              dot={false} 
              activeDot={{ r: 4, strokeWidth: 0, fill: portfolioColor }}
              isAnimationActive={true}
              animationDuration={700}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
