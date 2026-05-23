"use client";

import { MetricsResponse } from "@/types";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";

import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

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
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const tooltipBg = isDark ? "#1c1b1b" : "#ffffff";
  const tooltipBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

  return (
    <div className="h-full flex flex-col">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorDd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month:'short'})} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} domain={[minDrawdown * 1.1, 0]} tickFormatter={(val) => `${val.toFixed(0)}%`} />
              <Tooltip 
                contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: "8px" }}
                itemStyle={{ fontSize: "12px", color: isDark ? "#ffffff" : "#191c1d" }}
                formatter={(value: number) => [`${value.toFixed(2)}%`, "Drawdown"]}
                labelStyle={{ fontSize: "12px", color: "#888888" }}
              />
              <ReferenceLine y={minDrawdown} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideBottomRight', value: 'Max DD', fill: '#ef4444', fontSize: 12 }} />
              <Area type="monotone" dataKey="drawdown" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorDd)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
    </div>
  );
}
