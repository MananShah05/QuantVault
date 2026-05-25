/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Info, ChevronUp, ChevronDown, Download } from "lucide-react";

import { usePortfolios } from "@/hooks/usePortfolio";
import { useAllSnapshots } from "@/hooks/useAnalytics";
import { deriveAnalyticsMetrics } from "@/lib/derived";
import { motion, AnimatePresence } from "framer-motion";
import { MOTION } from "@/lib/motion";
import {
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
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

type SortField = "ticker" | "weight" | "assetReturn" | "contribution" | "sharpe" | "maxDd";
type SortDirection = "asc" | "desc";

export default function AnalyticsComparePage() {
  const { data: portfolios = [], isLoading: isListLoading, isError } = usePortfolios();

  // Filter ready portfolios with snapshot summaries
  const readyPortfolios = useMemo(() => {
    return portfolios.filter((p) => p.status === "ready" && p.latest_snapshot);
  }, [portfolios]);

  const readyIds = useMemo(() => readyPortfolios.map((p) => p.id), [readyPortfolios]);

  // Parallel fetch of detailed snapshots for ready portfolios
  const snapshotsResults = useAllSnapshots(readyIds);
  const isSnapshotsLoading = snapshotsResults.some((r) => r.isLoading);

  const snapshotsMap = useMemo(() => {
    const map: Record<string, any> = {};
    readyIds.forEach((id, index) => {
      const res = snapshotsResults[index];
      if (res && res.data) {
        map[id] = res.data;
      }
    });
    return map;
  }, [readyIds, snapshotsResults]);

  // Selected portfolio for asset contribution table
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  
  // Sorting state for asset contribution table
  const [sortField, setSortField] = useState<SortField>("contribution");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Calculations for Calmar strip
  const stats = useMemo(() => {
    if (readyPortfolios.length === 0) return null;

    let bestCalmarPortfolio = readyPortfolios[0];
    let bestCalmarValue = -Infinity;

    let bestSharpePortfolio = readyPortfolios[0];
    let bestSharpeValue = -Infinity;

    let worstEfficiencyPortfolio = readyPortfolios[0];
    let worstEfficiencyValue = Infinity;

    readyPortfolios.forEach((p) => {
      const snap = p.latest_snapshot!;
      const metrics = deriveAnalyticsMetrics({
        annualized_return: snap.annualized_return,
        portfolio_volatility: snap.portfolio_volatility,
        max_drawdown: snap.max_drawdown,
        sharpe_ratio: snap.sharpe_ratio,
      });

      if (metrics.calmar > bestCalmarValue) {
        bestCalmarValue = metrics.calmar;
        bestCalmarPortfolio = p;
      }

      const sharpe = snap.sharpe_ratio ?? -Infinity;
      if (sharpe > bestSharpeValue) {
        bestSharpeValue = sharpe;
        bestSharpePortfolio = p;
      }

      if (metrics.returnEfficiency < worstEfficiencyValue) {
        worstEfficiencyValue = metrics.returnEfficiency;
        worstEfficiencyPortfolio = p;
      }
    });

    return {
      bestCalmar: {
        portfolio: bestCalmarPortfolio,
        calmar: bestCalmarValue,
        sharpe: bestCalmarPortfolio.latest_snapshot!.sharpe_ratio ?? 0,
      },
      bestSharpe: {
        portfolio: bestSharpePortfolio,
        return: bestSharpePortfolio.latest_snapshot!.annualized_return ?? 0,
        volatility: bestSharpePortfolio.latest_snapshot!.portfolio_volatility ?? 0,
      },
      worstEfficiency: {
        portfolio: worstEfficiencyPortfolio,
      },
    };
  }, [readyPortfolios]);

  // Scatter chart data
  const scatterData = useMemo(() => {
    return readyPortfolios.map((p) => {
      const snap = p.latest_snapshot!;
      const metrics = deriveAnalyticsMetrics({
        annualized_return: snap.annualized_return,
        portfolio_volatility: snap.portfolio_volatility,
        max_drawdown: snap.max_drawdown,
        sharpe_ratio: snap.sharpe_ratio,
      });
      return {
        id: p.id,
        name: p.name,
        x: snap.portfolio_volatility ?? 0,
        y: snap.annualized_return ?? 0,
        sharpe: snap.sharpe_ratio ?? 0,
        calmar: metrics.calmar,
      };
    });
  }, [readyPortfolios]);

  // Bar chart data
  const barData = useMemo(() => {
    return [...readyPortfolios]
      .sort((a, b) => (b.latest_snapshot!.annualized_return ?? 0) - (a.latest_snapshot!.annualized_return ?? 0))
      .map((p) => {
        const snap = p.latest_snapshot!;
        const metrics = deriveAnalyticsMetrics({
          annualized_return: snap.annualized_return,
          portfolio_volatility: snap.portfolio_volatility,
          max_drawdown: snap.max_drawdown,
          sharpe_ratio: snap.sharpe_ratio,
        });
        return {
          name: p.name,
          return: snap.annualized_return ?? 0,
          calmar: metrics.calmar,
          sharpe: snap.sharpe_ratio ?? 0,
        };
      });
  }, [readyPortfolios]);

  // Selected portfolio detailed assets contribution calculations
  const tableData = useMemo(() => {
    if (!selectedPortfolioId) return null;
    const portfolio = readyPortfolios.find((p) => p.id === selectedPortfolioId);
    const snapshot = snapshotsMap[selectedPortfolioId];
    if (!portfolio || !snapshot || !snapshot.per_asset) return null;

    const assets = portfolio.assets || [];
    const perAsset = snapshot.per_asset;

    const rows = assets.map((asset) => {
      const ticker = asset.ticker;
      const stats = perAsset[ticker] || { annualized_return: 0, volatility: 0, sharpe: 0, max_drawdown: 0 };
      const weight = asset.weight;
      const assetReturn = stats.annualized_return ?? 0;
      const contribution = assetReturn * weight;
      
      return {
        ticker,
        weight,
        assetReturn,
        contribution,
        sharpe: stats.sharpe ?? 0,
        maxDd: stats.max_drawdown ?? 0,
      };
    });

    // Sort rows
    rows.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      aVal = aVal as number;
      bVal = bVal as number;

      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });

    return {
      portfolioName: portfolio.name,
      rows,
      totals: {
        annualizedReturn: snapshot.annualized_return ?? 0,
        sharpe: snapshot.sharpe_ratio ?? 0,
        maxDd: snapshot.max_drawdown ?? 0,
      }
    };
  }, [selectedPortfolioId, readyPortfolios, snapshotsMap, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp size={12} className="inline ml-1" />
    ) : (
      <ChevronDown size={12} className="inline ml-1" />
    );
  };

  // Custom scatter dot shape that also renders the label text above it
  const CustomScatterDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return <g />;
    const r = Math.max(4, 6 + (payload.sharpe * 3));
    const fill = payload.y > 0.065 ? "var(--positive)" : "var(--negative)";
    return (

      <g className="cursor-pointer">
        <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={0.75} stroke={fill} strokeWidth={1} />
        <text
          x={cx}
          y={cy - r - 6}
          textAnchor="middle"
          fill="var(--text-secondary)"
          className="font-sans text-[10px] font-medium"
        >
          {payload.name}
        </text>
      </g>
    );
  };

  // Custom horizontal bar label renderer inside the bar
  const CustomBarLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    if (width < 35) return null;
    const xPos = value >= 0 ? x + width - 8 : x + width + 8;
    const textAnchor = value >= 0 ? "end" : "start";
    const fill = value >= 0 ? "var(--bg-base)" : "var(--text-primary)";
    return (
      <text
        x={xPos}
        y={y + height / 2 + 4}
        fill={fill}
        className="font-mono text-[10px] font-semibold"
        textAnchor={textAnchor}
      >
        {(value * 100).toFixed(1)}%
      </text>
    );
  };

  if (isListLoading || isSnapshotsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] w-full gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <span className="font-mono text-xs text-text-secondary uppercase tracking-wider">Aggregating Asset Attribution...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)] w-full text-negative font-sans text-sm">
        Failed to load portfolio comparison data.
      </div>
    );
  }

  if (readyPortfolios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] w-full p-4 font-sans select-none">
        <div className="bg-surface border border-subtle p-12 text-center flex flex-col items-center justify-center max-w-lg rounded-lg">
          <p className="text-sm font-semibold text-foreground mb-4">No active portfolios ready</p>
          <p className="text-xs text-[var(--text-secondary)] mb-6 max-w-sm">
            Create or compute a portfolio first to enable efficiency and attribution analysis.
          </p>
          <Link href="/portfolio/new">
            <button className="h-9 bg-accent hover:bg-[#3b7de8] text-white font-sans text-xs font-medium px-4 rounded-[6px] transition-all">
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
          <h1 className="font-serif italic text-3xl text-foreground">Analytics</h1>
          <p className="text-sm text-text-secondary mt-1">Return efficiency · Risk-adjusted performance · Attribution</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={async () => {
              try {
                const { api } = await import("@/lib/api");
                const response = await api.get("/api/portfolios/export-all-csv", {
                  responseType: 'blob',
                });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `QuantVault_Analytics_Summary.csv`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
              } catch (error) {
                console.error("Export all failed", error);
              }
            }}
            className="h-8 flex items-center gap-1.5 px-3 rounded-md bg-surface border border-default text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-strong transition-colors font-sans text-xs"
          >
            <Download size={12} />
            <span>Export CSV</span>
          </button>
          <div className="font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider">
            {readyPortfolios.length} Portfolios Analyzed
          </div>
        </div>
      </div>

      {/* Section 1: Calmar Strip */}
      {stats && (
        <motion.div
          variants={MOTION.pageContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* Card 1: Best Calmar */}
          <motion.div
            variants={MOTION.itemUp}
            className="bg-surface border border-subtle rounded-lg py-5 px-6 flex flex-col justify-between border-l-[3px] border-l-positive rounded-l-none min-h-[110px]"
          >
            <span className="font-sans text-[10px] font-semibold tracking-[0.12em] text-[var(--text-muted)] uppercase">
              Highest Return Efficiency
            </span>
            <div className="mt-2.5">
              <p className="font-sans text-sm font-bold text-foreground truncate">{stats.bestCalmar.portfolio.name}</p>
              <div className="flex gap-4 mt-2 font-mono text-[12px]">
                <div>
                  <span className="text-[var(--text-muted)]">Calmar:</span>{" "}
                  <span className="text-positive font-bold">{stats.bestCalmar.calmar.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Sharpe:</span>{" "}
                  <span className="text-foreground">{stats.bestCalmar.sharpe.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Capital Market Line Leader */}
          <motion.div
            variants={MOTION.itemUp}
            className="bg-surface border border-subtle rounded-lg py-5 px-6 flex flex-col justify-between border-l-[3px] border-l-accent rounded-l-none min-h-[110px]"
          >
            <span className="font-sans text-[10px] font-semibold tracking-[0.12em] text-[var(--text-muted)] uppercase">
              Best Risk-Adjusted Return
            </span>
            <div className="mt-2.5">
              <p className="font-sans text-sm font-bold text-foreground truncate">{stats.bestSharpe.portfolio.name}</p>
              <p className="font-mono text-[12px] text-accent font-bold mt-2">
                +{((stats.bestSharpe.return) * 100).toFixed(1)}% return at {((stats.bestSharpe.volatility) * 100).toFixed(1)}% vol
              </p>
            </div>
          </motion.div>

          {/* Card 3: Worst Efficiency */}
          <motion.div
            variants={MOTION.itemUp}
            className="bg-surface border border-subtle rounded-lg py-5 px-6 flex flex-col justify-between border-l-[3px] border-l-negative rounded-l-none min-h-[110px]"
          >
            <span className="font-sans text-[10px] font-semibold tracking-[0.12em] text-[var(--text-muted)] uppercase">
              Lowest Return Efficiency
            </span>
            <div className="mt-2.5">
              <p className="font-sans text-sm font-bold text-foreground truncate">{stats.worstEfficiency.portfolio.name}</p>
              <p className="font-sans text-xs text-text-secondary mt-2">
                High volatility, low return posture
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Section 2 & 3: Scatter and Bar side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Efficiency Scatter */}
        <motion.div
          variants={MOTION.chartReveal}
          initial="hidden"
          animate="show"
          className="lg:col-span-3 bg-surface border border-subtle rounded-lg p-5 flex flex-col relative"
        >
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-sans font-bold tracking-[0.12em] text-[var(--text-muted)] uppercase">
              Return vs Risk Efficiency
            </span>
            <div className="flex gap-4 font-mono text-[9px] text-[var(--text-muted)]">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-positive" />
                <span>Beats Risk-Free</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-negative" />
                <span>Sub-Risk-Free</span>
              </div>
            </div>
          </div>

          <div className="w-full h-[300px]">
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
                  name="Return"
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
                            <p>Annualized Return: <span className="text-foreground font-semibold">{(data.y * 100).toFixed(2)}%</span></p>
                            <p>Annual Volatility: <span className="text-foreground font-semibold">{(data.x * 100).toFixed(2)}%</span></p>
                            <p>Sharpe Ratio: <span className="text-accent font-semibold">{data.sharpe.toFixed(2)}</span></p>
                            <p>Calmar Ratio: <span className="text-positive font-semibold">{data.calmar.toFixed(2)}</span></p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* y=0.065 Risk-Free threshold reference line */}
                <ReferenceLine
                  y={0.065}
                  stroke="rgba(251,191,36,0.35)"
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                  label={{
                    value: "Rf = 6.5%",
                    position: "right",
                    fill: "var(--warning)",
                    fontFamily: "IBM Plex Mono",
                    fontSize: 9,
                    dy: -8,
                  }}
                />

                <ReferenceLine x={0} stroke={CHART_THEME.axisColor} />
                
                <Scatter
                  name="Portfolios"
                  data={scatterData}
                  shape={CustomScatterDot as any}
                />

              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Return Ranking */}
        <motion.div
          variants={MOTION.chartReveal}
          initial="hidden"
          animate="show"
          className="lg:col-span-2 bg-surface border border-subtle rounded-lg p-5 flex flex-col"
        >
          <span className="text-[10px] font-sans font-bold tracking-[0.12em] text-[var(--text-muted)] uppercase mb-4 block">
            Annualised Return Ranking
          </span>

          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={barData}
                margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="0" stroke={CHART_THEME.gridColor} horizontal={false} />
                
                <XAxis
                  type="number"
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  stroke={CHART_THEME.tickColor}
                  fontSize={10}
                  fontFamily="IBM Plex Mono"
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke={CHART_THEME.tickColor}
                  fontSize={10}
                  fontFamily="DM Sans"
                  tickLine={false}
                  axisLine={false}
                  width={80}
                  className="font-medium"
                />

                <Tooltip
                  formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, "Annualized Return"]}
                  contentStyle={CHART_THEME.tooltip.contentStyle}
                  itemStyle={CHART_THEME.tooltip.itemStyle}
                  labelStyle={CHART_THEME.tooltip.labelStyle}
                />

                {/* risk-free reference line */}
                <ReferenceLine
                  x={0.065}
                  stroke="rgba(251,191,36,0.3)"
                  strokeDasharray="4 3"
                />

                <Bar dataKey="return" radius={[0, 2, 2, 0]}>
                  {barData.map((entry, index) => {
                    let fill = "var(--negative)";
                    if (entry.return > 0.065) fill = "var(--positive)";
                    else if (entry.return > 0) fill = "var(--warning)";
                    return <Cell key={`cell-${index}`} fill={fill} fillOpacity={0.75} />;
                  })}
                  <CustomBarLabel dataKey="return" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Section 4: Per-Asset Contribution Table */}
      <div className="bg-surface border border-subtle rounded-lg p-5 flex flex-col space-y-5">
        <div className="flex justify-between items-center border-b border-subtle pb-3">
          <span className="text-[10px] font-sans font-bold tracking-[0.12em] text-[var(--text-muted)] uppercase">
            Per-Asset Return Contribution Analysis
          </span>
        </div>

        {/* Row of Portfolio selection pills */}
        <div className="flex flex-wrap gap-2">
          {readyPortfolios.map((p) => {
            const isActive = selectedPortfolioId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPortfolioId(isActive ? null : p.id)}
                className={`px-3 py-1.5 rounded-[4px] font-mono text-[11px] font-medium border transition-all duration-150 ${
                  isActive
                    ? "bg-accent-dim text-accent border-accent/40 shadow-sm"
                    : "bg-elevated hover:bg-overlay text-text-secondary border-subtle hover:text-foreground"
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>

        {/* Table representation */}
        <AnimatePresence mode="wait">
          {tableData ? (
            <motion.div
              key={selectedPortfolioId}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="overflow-x-auto w-full pt-1"
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-subtle">
                    <th
                      onClick={() => handleSort("ticker")}
                      className="px-4 py-2.5 font-sans text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.1em] cursor-pointer hover:text-foreground select-none"
                    >
                      Ticker {renderSortIcon("ticker")}
                    </th>
                    <th
                      onClick={() => handleSort("weight")}
                      className="px-4 py-2.5 font-sans text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.1em] cursor-pointer hover:text-foreground select-none"
                    >
                      Weight {renderSortIcon("weight")}
                    </th>
                    <th
                      onClick={() => handleSort("assetReturn")}
                      className="px-4 py-2.5 font-sans text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.1em] cursor-pointer hover:text-foreground select-none"
                    >
                      Asset Return {renderSortIcon("assetReturn")}
                    </th>
                    <th
                      onClick={() => handleSort("contribution")}
                      className="px-4 py-2.5 font-sans text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.1em] cursor-pointer hover:text-foreground select-none"
                    >
                      Contribution {renderSortIcon("contribution")}
                    </th>
                    <th
                      onClick={() => handleSort("sharpe")}
                      className="px-4 py-2.5 font-sans text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.1em] cursor-pointer hover:text-foreground select-none"
                    >
                      Sharpe {renderSortIcon("sharpe")}
                    </th>
                    <th
                      onClick={() => handleSort("maxDd")}
                      className="px-4 py-2.5 font-sans text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.1em] cursor-pointer hover:text-foreground select-none"
                    >
                      Max DD {renderSortIcon("maxDd")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle font-mono text-[13px] text-text-secondary">
                  {tableData.rows.map((row) => (
                    <tr
                      key={row.ticker}
                      className="hover:bg-elevated/40 transition-colors duration-100"
                    >
                      <td className="px-4 py-3 text-foreground font-semibold font-sans">{row.ticker}</td>
                      <td className="px-4 py-3 relative min-w-[120px]">
                        <span className="relative z-10">{(row.weight * 100).toFixed(0)}%</span>
                        {/* inline progress bar background */}
                        <div className="absolute left-4 bottom-0 right-4 h-[2px] bg-[var(--border-strong)]">
                          <div
                            className="h-full bg-accent/40"
                            style={{ width: `${row.weight * 100}%` }}
                          />
                        </div>
                      </td>
                      <td className={`px-4 py-3 ${row.assetReturn >= 0 ? "text-positive" : "text-negative"}`}>
                        {row.assetReturn >= 0 ? "+" : ""}
                        {(row.assetReturn * 100).toFixed(2)}%
                      </td>
                      <td className={`px-4 py-3 font-bold ${row.contribution >= 0 ? "text-positive" : "text-negative"}`}>
                        {row.contribution >= 0 ? "+" : ""}
                        {(row.contribution * 100).toFixed(2)}%
                      </td>
                      <td className="px-4 py-3">{row.sharpe.toFixed(2)}</td>
                      <td className="px-4 py-3 text-negative font-medium">
                        {(row.maxDd * 100).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                  
                  {/* Total Row */}
                  <tr className="bg-elevated font-semibold border-t border-subtle">
                    <td className="px-4 py-3.5 text-foreground font-sans uppercase text-[11px] tracking-wider">
                      Portfolio Total
                    </td>
                    <td className="px-4 py-3.5 relative">
                      100%
                      <div className="absolute left-4 bottom-0 right-4 h-[2px] bg-accent/30" style={{ width: "calc(100% - 2rem)" }} />
                    </td>
                    <td className={`px-4 py-3.5 ${tableData.totals.annualizedReturn >= 0 ? "text-positive" : "text-negative"}`}>
                      {tableData.totals.annualizedReturn >= 0 ? "+" : ""}
                      {(tableData.totals.annualizedReturn * 100).toFixed(2)}%
                    </td>
                    <td className={`px-4 py-3.5 ${tableData.totals.annualizedReturn >= 0 ? "text-positive" : "text-negative"}`}>
                      {tableData.totals.annualizedReturn >= 0 ? "+" : ""}
                      {(tableData.totals.annualizedReturn * 100).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3.5 text-foreground">{tableData.totals.sharpe.toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-negative">{((tableData.totals.maxDd) * 100).toFixed(2)}%</td>
                  </tr>
                </tbody>
              </table>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center text-xs text-[var(--text-muted)] font-sans select-none flex flex-col items-center justify-center bg-base/50 rounded-lg border border-dashed border-subtle"
            >
              <Info size={16} className="text-[var(--text-muted)] mb-2" />
              <span>Select a portfolio above to view detailed per-asset return attribution</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
