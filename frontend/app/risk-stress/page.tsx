/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Loader2, Info } from "lucide-react";
import { usePortfolios } from "@/hooks/usePortfolio";
import { useAllMetrics } from "@/hooks/useAnalytics";
import { deriveRiskMetrics, riskGrade } from "@/lib/derived";
import { motion } from "framer-motion";
import { MOTION } from "@/lib/motion";
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ScatterChart,
  Scatter,
} from "recharts";

const CHART_THEME = {
  background: "transparent",
  gridColor: "var(--border-subtle)",
  axisColor: "var(--border-default)",
  tickColor: "var(--text-muted)",
  tickFont: { fontFamily: "IBM Plex Mono", fontSize: 10 },
  tooltip: {
    contentStyle: {
      background: "var(--bg-surface)",
      border: "1px solid var(--border-default)",
      borderRadius: "6px",
      fontFamily: "IBM Plex Mono",
      fontSize: "12px",
      padding: "10px 14px",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
    },
    labelStyle: { color: "#94a3b8", marginBottom: "6px" },
    itemStyle: { color: "var(--text-primary)" },
  }
};

// Series colors for Recharts overlay
const SERIES_COLORS = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
];

export default function RiskStressComparePage() {
  const { data: portfolios = [], isLoading: isListLoading, isError } = usePortfolios();

  // Filter ready portfolios with snapshots
  const readyPortfolios = useMemo(() => {
    return portfolios.filter((p) => p.status === "ready" && p.latest_snapshot);
  }, [portfolios]);

  const readyIds = useMemo(() => readyPortfolios.map((p) => p.id), [readyPortfolios]);

  // Parallel fetch 1Y daily metrics for each ready portfolio
  const metricsResults = useAllMetrics(readyIds);
  const isMetricsLoading = metricsResults.some((r) => r.isLoading);

  // Extract and compute drawdown series for each portfolio
  const drawdownsByPortfolio = useMemo(() => {
    return readyIds.map((id, index) => {
      const result = metricsResults[index];
      const portfolioName = readyPortfolios[index]?.name || "Portfolio";
      const rawSeries = result?.data?.portfolio || [];
      return {
        portfolioId: id,
        portfolioName,
        series: rawSeries.map((row) => ({
          date: row.date,
          drawdown: row.drawdown ?? 0,
        })),
      };
    });
  }, [readyIds, readyPortfolios, metricsResults]);

  // Merge daily drawdown series for composed chart
  const mergedData = useMemo(() => {
    const allDatesSet = new Set<string>();
    drawdownsByPortfolio.forEach(({ series }) => {
      series.forEach((s) => {
        if (s.date) allDatesSet.add(s.date);
      });
    });

    const allDates = Array.from(allDatesSet).sort();

    return allDates.map((date) => {
      const row: Record<string, any> = { date };
      drawdownsByPortfolio.forEach(({ portfolioName, series }) => {
        const point = series.find((s) => s.date === date);
        row[portfolioName] = point ? point.drawdown : 0;
      });
      return row;
    });
  }, [drawdownsByPortfolio]);

  // Dynamic calculations for Risk Summary cards
  const stats = useMemo(() => {
    if (readyPortfolios.length === 0 || drawdownsByPortfolio.length === 0) return null;

    let worstDdPortfolio = readyPortfolios[0];
    let worstDdVal = 0; // drawdowns are negative, so we find minimum

    let bestDdPortfolio = readyPortfolios[0];
    let bestDdVal = -Infinity; // least negative max drawdown

    let slowestRecoveryPortfolio = readyPortfolios[0];
    let maxRecoveryDays = -1;
    let slowestRecoveryIsUnrecovered = false;
    let slowestRecoveryPeakLoss = 0;

    readyPortfolios.forEach((p, i) => {
      const snap = p.latest_snapshot!;
      const dd = snap.max_drawdown ?? 0;
      
      if (dd < worstDdVal) {
        worstDdVal = dd;
        worstDdPortfolio = p;
      }
      
      if (dd > bestDdVal) {
        bestDdVal = dd;
        bestDdPortfolio = p;
      }

      const series = drawdownsByPortfolio[i]?.series.map((s) => s.drawdown) ?? [];
      const derived = deriveRiskMetrics(series);

      // Longest recovery days calculation
      if (derived.recoveryDays === null && !slowestRecoveryIsUnrecovered) {
        // First unrecovered portfolio takes priority
        slowestRecoveryIsUnrecovered = true;
        slowestRecoveryPortfolio = p;
        slowestRecoveryPeakLoss = dd;
      } else if (derived.recoveryDays === null && slowestRecoveryIsUnrecovered) {
        // If multiple are unrecovered, pick the one with the deepest peak loss
        if (dd < slowestRecoveryPeakLoss) {
          slowestRecoveryPortfolio = p;
          slowestRecoveryPeakLoss = dd;
        }
      } else if (!slowestRecoveryIsUnrecovered && derived.recoveryDays !== null && derived.recoveryDays > maxRecoveryDays) {
        maxRecoveryDays = derived.recoveryDays;
        slowestRecoveryPortfolio = p;
        slowestRecoveryPeakLoss = dd;
      }
    });

    // Find pain index for the worst drawdown vault
    const worstSeries = drawdownsByPortfolio.find((d) => d.portfolioId === worstDdPortfolio.id)?.series.map((s) => s.drawdown) ?? [];
    const worstPainIndex = deriveRiskMetrics(worstSeries).painIndex;

    // Find ulcer index for the most stable vault
    const stableSeries = drawdownsByPortfolio.find((d) => d.portfolioId === bestDdPortfolio.id)?.series.map((s) => s.drawdown) ?? [];
    const stableUlcerIndex = deriveRiskMetrics(stableSeries).ulcerIndex;

    return {
      worstDd: {
        portfolio: worstDdPortfolio,
        maxDd: worstDdVal,
        painIndex: worstPainIndex,
      },
      mostStable: {
        portfolio: bestDdPortfolio,
        maxDd: bestDdVal,
        ulcerIndex: stableUlcerIndex,
      },
      slowestRecovery: {
        portfolio: slowestRecoveryPortfolio,
        recoveryDays: slowestRecoveryIsUnrecovered ? null : maxRecoveryDays,
        peakLoss: slowestRecoveryPeakLoss,
      },
    };
  }, [readyPortfolios, drawdownsByPortfolio]);

  // Compute dynamic medians for bubble quadrant divisions
  const medians = useMemo(() => {
    if (readyPortfolios.length === 0) return { vol: 0.15, dd: 0.15 };

    const vols = readyPortfolios.map((p) => p.latest_snapshot!.portfolio_volatility ?? 0).sort((a, b) => a - b);
    const dds = readyPortfolios.map((p) => Math.abs(p.latest_snapshot!.max_drawdown ?? 0)).sort((a, b) => a - b);

    const halfVol = Math.floor(vols.length / 2);
    const halfDd = Math.floor(dds.length / 2);

    const medianVol = vols.length % 2 !== 0 ? vols[halfVol] : (vols[halfVol - 1] + vols[halfVol]) / 2;
    const medianDd = dds.length % 2 !== 0 ? dds[halfDd] : (dds[halfDd - 1] + dds[halfDd]) / 2;

    return {
      vol: medianVol > 0 ? medianVol : 0.15,
      dd: medianDd > 0 ? medianDd : 0.15,
    };
  }, [readyPortfolios]);

  // Bubble chart data
  const bubbleData = useMemo(() => {
    return readyPortfolios.map((p, i) => {
      const snap = p.latest_snapshot!;
      const series = drawdownsByPortfolio[i]?.series.map((s) => s.drawdown) ?? [];
      const { ulcerIndex } = deriveRiskMetrics(series);
      const grade = riskGrade(snap.max_drawdown, ulcerIndex);

      return {
        name: p.name,
        x: snap.portfolio_volatility ?? 0,
        y: Math.abs(snap.max_drawdown ?? 0),
        size: ulcerIndex,
        grade,
      };
    });
  }, [readyPortfolios, drawdownsByPortfolio]);

  // Scorecard data
  const scorecardRows = useMemo(() => {
    return readyPortfolios
      .map((p, i) => {
        const snap = p.latest_snapshot!;
        const series = drawdownsByPortfolio[i]?.series.map((s) => s.drawdown) ?? [];
        const { painIndex, ulcerIndex, recoveryDays } = deriveRiskMetrics(series);
        const grade = riskGrade(snap.max_drawdown, ulcerIndex);

        return {
          id: p.id,
          name: p.name,
          maxDrawdown: snap.max_drawdown ?? 0,
          painIndex,
          ulcerIndex,
          recoveryDays,
          grade,
        };
      })
      .sort((a, b) => a.maxDrawdown - b.maxDrawdown); // Worst drawdown first
  }, [readyPortfolios, drawdownsByPortfolio]);

  // Custom bubble dot shape
  const CustomBubbleDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return <g />;

    
    // Scale bubble radius based on Ulcer Index
    const r = Math.min(24, Math.max(5, payload.size * 120));
    
    let color = "var(--positive)";
    if (payload.grade === "B") color = "var(--accent)";
    else if (payload.grade === "C") color = "var(--warning)";
    else if (payload.grade === "D") color = "var(--negative)";

    return (
      <g className="cursor-pointer">
        <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={0.7} stroke={color} strokeWidth={1} />
        <text
          x={cx}
          y={cy - r - 5}
          textAnchor="middle"
          fill="var(--text-secondary)"
          className="font-sans text-[10px] font-medium"
        >
          {payload.name}
        </text>
      </g>
    );
  };

  // Find overall deepest drawdown to set proper Y-axis range
  const overallWorstDd = useMemo(() => {
    const dds = readyPortfolios.map((p) => p.latest_snapshot!.max_drawdown ?? 0);
    const min = Math.min(...dds, -0.05);
    return min;
  }, [readyPortfolios]);


  if (isListLoading || isMetricsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] w-full gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <span className="font-mono text-xs text-text-secondary uppercase tracking-wider">Loading Time-Series Drawdowns...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)] w-full text-negative font-sans text-sm">
        Failed to load portfolio risk stress analysis.
      </div>
    );
  }

  if (readyPortfolios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] w-full p-4 font-sans select-none">
        <div className="bg-surface border border-subtle p-12 text-center flex flex-col items-center justify-center max-w-lg rounded-lg">
          <p className="text-sm font-semibold text-foreground mb-4">No active risk stress data ready</p>
          <p className="text-xs text-[var(--text-secondary)] mb-6 max-w-sm">
            Create or compute a portfolio first to enable multi-asset drawdown and stress diagnostics.
          </p>
          <Link href="/portfolio/new">
            <button className="h-9 bg-accent hover:bg-accent-hover text-[var(--accent-foreground)] font-sans text-xs font-medium px-4 rounded-[6px] transition-all">
              Create Portfolio
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-8 w-full select-none text-text-secondary font-sans space-y-8 max-w-[1400px] mx-auto">
      
      {/* Page Header */}
      <div className="flex justify-between items-end pb-5 border-b border-subtle">
        <div>
          <h1 className="font-serif italic text-3xl text-foreground">Risk Stress</h1>
          <p className="text-sm text-text-secondary mt-1">Drawdown profiles · Tail risk · Recovery analysis</p>
        </div>
        <div className="font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider">
          12-Month Lookback
        </div>
      </div>

      {/* Section 1: Risk Summary Strip */}
      {stats && (
        <motion.div
          variants={MOTION.pageContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* Card 1: Worst Drawdown */}
          <motion.div
            variants={MOTION.itemUp}
            className="bg-surface border border-subtle rounded-lg py-5 px-6 flex flex-col justify-between border-l-[3px] border-l-negative rounded-l-none min-h-[110px]"
          >
            <span className="font-sans text-[10px] font-semibold tracking-[0.12em] text-[var(--text-muted)] uppercase">
              Deepest Drawdown (Worst Vault)
            </span>
            <div className="mt-2.5">
              <p className="font-sans text-sm font-bold text-foreground truncate">{stats.worstDd.portfolio.name}</p>
              <div className="flex items-baseline gap-3 mt-1.5">
                <span className="font-mono text-lg font-bold text-negative">
                  {(stats.worstDd.maxDd * 100).toFixed(1)}%
                </span>
                <span className="font-mono text-xs text-[var(--text-muted)]">
                  Pain Index: {(stats.worstDd.painIndex * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Most Stable */}
          <motion.div
            variants={MOTION.itemUp}
            className="bg-surface border border-subtle rounded-lg py-5 px-6 flex flex-col justify-between border-l-[3px] border-l-positive rounded-l-none min-h-[110px]"
          >
            <span className="font-sans text-[10px] font-semibold tracking-[0.12em] text-[var(--text-muted)] uppercase">
              Most Stable Vault
            </span>
            <div className="mt-2.5">
              <p className="font-sans text-sm font-bold text-foreground truncate">{stats.mostStable.portfolio.name}</p>
              <div className="flex items-baseline gap-3 mt-1.5">
                <span className="font-mono text-lg font-bold text-positive">
                  {(stats.mostStable.maxDd * 100).toFixed(1)}%
                </span>
                <span className="font-mono text-xs text-[var(--text-muted)]">
                  Ulcer Index: {(stats.mostStable.ulcerIndex * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Slowest Recovery */}
          <motion.div
            variants={MOTION.itemUp}
            className="bg-surface border border-subtle rounded-lg py-5 px-6 flex flex-col justify-between border-l-[3px] border-l-warning rounded-l-none min-h-[110px]"
          >
            <span className="font-sans text-[10px] font-semibold tracking-[0.12em] text-[var(--text-muted)] uppercase">
              Slowest Recovery
            </span>
            <div className="mt-2.5">
              <p className="font-sans text-sm font-bold text-foreground truncate">{stats.slowestRecovery.portfolio.name}</p>
              <div className="flex items-baseline gap-3 mt-1.5">
                <span className="font-mono text-lg font-bold text-warning">
                  {stats.slowestRecovery.recoveryDays === null
                    ? "Not yet recovered"
                    : `${stats.slowestRecovery.recoveryDays} days`}
                </span>
                <span className="font-mono text-xs text-[var(--text-muted)]">
                  Peak loss: {(stats.slowestRecovery.peakLoss * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Section 2: Drawdown Profile 12-Month Overlay */}
      <motion.div
        variants={MOTION.chartReveal}
        initial="hidden"
        animate="show"
        className="bg-surface border border-subtle rounded-lg p-5 flex flex-col"
      >
        <span className="text-[10px] font-sans font-bold tracking-[0.12em] text-[var(--text-muted)] uppercase mb-4 block">
          Drawdown Profiles — 12-Month Overlay
        </span>

        <div className="w-full h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={mergedData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="0" stroke={CHART_THEME.gridColor} />
              
              <XAxis
                dataKey="date"
                stroke={CHART_THEME.tickColor}
                fontSize={10}
                fontFamily="IBM Plex Mono"
                tickLine={false}
                axisLine={false}
                dy={8}
                tickFormatter={(dateStr) => {
                  try {
                    const date = new Date(dateStr);
                    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
                  } catch {
                    return dateStr;
                  }
                }}
              />

              <YAxis
                domain={[overallWorstDd * 1.15, 0]}
                stroke={CHART_THEME.tickColor}
                fontSize={10}
                fontFamily="IBM Plex Mono"
                tickLine={false}
                axisLine={false}
                dx={-8}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    // Sort items from worst drawdown (lowest negative value) to best
                    const sortedPayload = [...payload].sort((a, b) => (a.value as number) - (b.value as number));
                    
                    let dateLabel = label;
                    try {
                      dateLabel = new Date(label).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      });
                    } catch {}

                    return (
                      <div style={CHART_THEME.tooltip.contentStyle as any}>
                        <p className="font-sans font-semibold text-text-secondary text-[11px] mb-2 border-b border-subtle pb-1.5">{dateLabel}</p>
                        <div className="space-y-1">
                          {sortedPayload.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center gap-6 font-mono text-[11px]">
                              <span className="font-sans text-foreground font-semibold flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                                {item.name}
                              </span>
                              <span className="font-bold text-negative">
                                {((item.value as number) * 100).toFixed(2)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{
                  fontSize: "11px",
                  fontFamily: "DM Sans",
                  paddingBottom: "15px",
                }}
                iconType="circle"
                iconSize={8}
              />

              {/* Reference horizontal lines */}
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeWidth={0.75} />
              
              <ReferenceLine
                y={-0.1}
                stroke="var(--warning-dim)"
                strokeDasharray="4 3"
                label={{
                  value: "-10%",
                  position: "right",
                  fill: "var(--warning)",
                  fontFamily: "IBM Plex Mono",
                  fontSize: 9,
                  opacity: 0.7,
                }}
              />
              
              <ReferenceLine
                y={-0.2}
                stroke="var(--negative-dim)"
                strokeDasharray="4 3"
                label={{
                  value: "-20%",
                  position: "right",
                  fill: "var(--negative)",
                  fontFamily: "IBM Plex Mono",
                  fontSize: 9,
                  opacity: 0.7,
                }}
              />

              {drawdownsByPortfolio.map(({ portfolioName }, idx) => {
                const color = SERIES_COLORS[idx % SERIES_COLORS.length];
                return (
                  <Area
                    key={portfolioName}
                    type="monotone"
                    dataKey={portfolioName}
                    name={portfolioName}
                    stroke={color}
                    fill={color}
                    fillOpacity={0.05}
                    strokeWidth={1.5}
                  />
                );
              })}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Section 3 & 4: Bubble Chart and Scorecard Table side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Risk Quadrant Bubble Chart */}
        <motion.div
          variants={MOTION.chartReveal}
          initial="hidden"
          animate="show"
          className="bg-surface border border-subtle rounded-lg p-5 flex flex-col relative overflow-hidden"
        >
          <span className="text-[10px] font-sans font-bold tracking-[0.12em] text-[var(--text-muted)] uppercase mb-4 block">
            Risk Quadrant — Volatility vs Drawdown Depth
          </span>

          {/* Absolute quadrant backgrounds & labels overlay */}
          <div className="absolute inset-0 top-12 bottom-6 left-12 right-6 pointer-events-none grid grid-cols-2 grid-rows-2 opacity-50 z-0">
            {/* Top-Left Quadrant */}
            <div className="border-r border-b border-default flex items-start justify-start p-3">
              <span className="font-mono text-[9px] font-bold text-warning tracking-wider uppercase">Tail-Risk</span>
            </div>
            {/* Top-Right Quadrant */}
            <div className="border-b border-default flex items-start justify-end p-3 text-right">
              <span className="font-mono text-[9px] font-bold text-negative tracking-wider uppercase">Aggressive</span>
            </div>
            {/* Bottom-Left Quadrant */}
            <div className="border-r border-default flex items-end justify-start p-3">
              <span className="font-mono text-[9px] font-bold text-positive tracking-wider uppercase">Conservative</span>
            </div>
            {/* Bottom-Right Quadrant */}
            <div className="flex items-end justify-end p-3 text-right">
              <span className="font-mono text-[9px] font-bold text-accent tracking-wider uppercase">Resilient</span>
            </div>
          </div>

          <div className="w-full h-[320px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="0" stroke={CHART_THEME.gridColor} />
                
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Volatility"
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  stroke={CHART_THEME.tickColor}
                  fontSize={10}
                  fontFamily="IBM Plex Mono"
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />

                <YAxis
                  type="number"
                  dataKey="y"
                  name="Drawdown Depth"
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  stroke={CHART_THEME.tickColor}
                  fontSize={10}
                  fontFamily="IBM Plex Mono"
                  tickLine={false}
                  axisLine={false}
                  dx={-8}
                />

                <Tooltip
                  cursor={{ strokeDasharray: "4 4", stroke: "rgba(255,255,255,0.06)" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={CHART_THEME.tooltip.contentStyle as any}>
                          <p className="font-sans font-bold text-foreground text-xs border-b border-subtle pb-1.5 mb-1.5">{data.name}</p>
                          <div className="space-y-1 text-[11px] font-mono text-text-secondary">
                            <p>Annual Volatility: <span className="text-foreground font-semibold">{(data.x * 100).toFixed(2)}%</span></p>
                            <p>Max Drawdown: <span className="text-negative font-semibold">-{(data.y * 100).toFixed(2)}%</span></p>
                            <p>Ulcer Index: <span className="text-foreground font-semibold">{(data.size * 100).toFixed(2)}%</span></p>
                            <p>Calculated Grade: <span className="text-accent font-semibold">{data.grade}</span></p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* Split dividers by median Vol and median MaxDrawdown */}
                <ReferenceLine x={medians.vol} stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="3 3" />
                <ReferenceLine y={medians.dd} stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="3 3" />

                <Scatter
                  name="Portfolios"
                  data={bubbleData}
                  shape={CustomBubbleDot as any}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Tail Risk Scorecard */}
        <motion.div
          variants={MOTION.chartReveal}
          initial="hidden"
          animate="show"
          className="bg-surface border border-subtle rounded-lg p-5 flex flex-col space-y-4"
        >
          <div className="flex justify-between items-center border-b border-subtle pb-3">
            <span className="text-[10px] font-sans font-bold tracking-[0.12em] text-[var(--text-muted)] uppercase">
              Tail Risk Scorecard
            </span>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-subtle">
                  <th className="px-3 py-2 font-sans text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.1em]">
                    Portfolio
                  </th>
                  <th className="px-3 py-2 font-sans text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.1em]">
                    <div className="flex items-center gap-1">
                      Max DD
                      <span title="Peak-to-trough loss in the period">
                        <Info
                          size={11}
                          className="text-[var(--text-muted)] cursor-help"
                        />
                      </span>
                    </div>
                  </th>
                  <th className="px-3 py-2 font-sans text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.1em]">
                    <div className="flex items-center gap-1">
                      Pain Index
                      <span title="Average daily drawdown — measures sustained losses">
                        <Info
                          size={11}
                          className="text-[var(--text-muted)] cursor-help"
                        />
                      </span>
                    </div>
                  </th>
                  <th className="px-3 py-2 font-sans text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.1em]">
                    <div className="flex items-center gap-1">
                      Ulcer Index
                      <span title="√mean(DD²) — penalises both depth and duration">
                        <Info
                          size={11}
                          className="text-[var(--text-muted)] cursor-help"
                        />
                      </span>
                    </div>
                  </th>
                  <th className="px-3 py-2 font-sans text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.1em]">
                    <div className="flex items-center gap-1">
                      Recovery
                      <span title="Days from max drawdown date to returning to prior peak">
                        <Info
                          size={11}
                          className="text-[var(--text-muted)] cursor-help"
                        />
                      </span>
                    </div>
                  </th>

                  <th className="px-3 py-2 font-sans text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.1em] text-right">
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle font-mono text-[13px] text-text-secondary">
                {scorecardRows.map((row) => {
                  let badgeColor = "text-positive bg-positive/10 border-positive/20";
                  if (row.grade === "B") badgeColor = "text-accent bg-accent/10 border-accent/20";
                  else if (row.grade === "C") badgeColor = "text-warning bg-warning/10 border-warning/20";
                  else if (row.grade === "D") badgeColor = "text-negative bg-negative/10 border-negative/20";

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-elevated/40 transition-colors duration-100"
                    >
                      <td className="px-3 py-3 font-sans text-foreground font-semibold truncate max-w-[130px]">
                        {row.name}
                      </td>
                      <td className="px-3 py-3 text-negative font-bold">
                        {(row.maxDrawdown * 100).toFixed(1)}%
                      </td>
                      <td className="px-3 py-3 text-negative opacity-70">
                        {(row.painIndex * 100).toFixed(1)}%
                      </td>
                      <td className="px-3 py-3 text-foreground">
                        {(row.ulcerIndex * 100).toFixed(1)}%
                      </td>
                      <td className={`px-3 py-3 ${row.recoveryDays === null ? "text-negative font-medium" : ""}`}>
                        {row.recoveryDays === null ? "Not recovered" : `${row.recoveryDays} days`}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                          {row.grade}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
