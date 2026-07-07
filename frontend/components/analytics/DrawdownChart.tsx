"use client";

import { MetricsResponse } from "@/types";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

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

export function DrawdownChart({ metrics }: { metrics: MetricsResponse }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = useMemo(
    () =>
      metrics.portfolio
        .map((p) => ({
          date: p.date,
          drawdown: p.drawdown !== null ? p.drawdown * 100 : 0,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [metrics],
  );

  const minDrawdown = chartData.length ? Math.min(...chartData.map((d) => d.drawdown)) : 0;

  const isDark = !mounted || theme === "dark";
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
        <AreaChart 
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
            domain={[minDrawdown * 1.1, 0]} 
            tickFormatter={(val) => `${val.toFixed(0)}%`}
            orientation="right"
          />
          
          <Tooltip 
            contentStyle={CHART_THEME.tooltip.contentStyle}
            labelStyle={CHART_THEME.tooltip.labelStyle}
            itemStyle={CHART_THEME.tooltip.itemStyle}
            formatter={(value: number) => [`${value.toFixed(2)}%`, "Drawdown"]}
          />
          
          <ReferenceLine 
            y={minDrawdown} 
            stroke="var(--negative)" 
            strokeDasharray="4 3" 
            label={{ 
              position: 'insideBottomRight', 
              value: `Max DD: ${minDrawdown.toFixed(1)}%`, 
              fill: 'var(--negative)', 
              fontSize: 10, 
              fontFamily: 'IBM Plex Mono' 
            }} 
          />
          
          <Area 
            type="monotone" 
            dataKey="drawdown" 
            stroke="var(--negative)" 
            strokeWidth={1.5} 
            fillOpacity={1} 
            fill="var(--negative-dim)" 
            isAnimationActive={true}
            animationDuration={700}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
