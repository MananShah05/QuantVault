"use client";

import { MetricsResponse } from "@/types";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

const PALETTE = ["#60A5FA", "#34D399", "#FBBF24", "#F87171", "#A78BFA"];

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
  const portfolioColor = isDark ? "#FFFFFF" : "#191c1d";
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const tooltipBg = isDark ? "#1c1b1b" : "#ffffff";
  const tooltipBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

  return (
    <div className="h-full flex flex-col">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month:'short'})} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val.toFixed(0)}%`} />
              <Tooltip 
                contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: "8px" }}
                itemStyle={{ fontSize: "12px", color: isDark ? "#ffffff" : "#191c1d" }}
                labelStyle={{ fontSize: "12px", color: "#888888", marginBottom: "4px" }}
                formatter={(value: number) => [`${value.toFixed(2)}%`]}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
              
              <Line type="monotone" dataKey="Portfolio" stroke={portfolioColor} strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              {hasBenchmark && (
                <Line type="monotone" dataKey="Benchmark" stroke="#e9c176" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              )}
              {tickers.map((ticker, i) => (
                <Line key={ticker} type="monotone" dataKey={ticker} stroke={PALETTE[i % PALETTE.length]} strokeWidth={1.5} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
    </div>
  );
}
