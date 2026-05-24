"use client";

import { MetricsResponse } from "@/types";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

// Series colors
const PALETTE = ["#4f8ef7", "#34d399", "#f59e0b", "#a78bfa", "#f87171"];
const BENCHMARK_COLOR = "var(--text-secondary)";

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

interface ChartDataItem {
  date: string;
  [key: string]: string | number | null;
}

export function ReturnsChart({ metrics }: { metrics: MetricsResponse }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { chartData, tickers, hasBenchmark } = useMemo(() => {
    const dataMap = new Map<string, ChartDataItem>();

    metrics.portfolio.forEach((p) => {
      dataMap.set(p.date, {
        date: p.date,
        Portfolio: p.cumulative_return !== null ? p.cumulative_return * 100 : null,
        Benchmark: p.benchmark_cumulative_return !== null ? p.benchmark_cumulative_return * 100 : null,
      });
    });

    Object.entries(metrics.assets).forEach(([ticker, rows]) => {
      rows.forEach((r) => {
        const item = dataMap.get(r.date);
        if (item) {
          item[ticker] = r.cumulative_return !== null ? r.cumulative_return * 100 : null;
        }
      });
    });

    return {
      chartData: Array.from(dataMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      tickers: Object.keys(metrics.assets),
      hasBenchmark: metrics.portfolio.some((p) => p.benchmark_cumulative_return !== null),
    };
  }, [metrics]);

  const isDark = !mounted || theme === "dark";
  const portfolioColor = isDark ? "var(--text-primary)" : "var(--bg-base)";
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
    <div className="h-full w-full">
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
            tickFormatter={(val) => `${val.toFixed(0)}%`}
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
          
          {hasBenchmark && (
            <Line 
              type="monotone" 
              dataKey="Benchmark" 
              stroke={BENCHMARK_COLOR} 
              strokeWidth={1.5} 
              strokeDasharray="4 3" 
              dot={false} 
              activeDot={{ r: 4, strokeWidth: 0, fill: BENCHMARK_COLOR }}
              isAnimationActive={true}
              animationDuration={700}
              animationEasing="ease-out"
            />
          )}

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
  );
}
