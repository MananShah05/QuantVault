"use client";

import { SnapshotResponse } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export function MetricCards({ snapshot }: { snapshot: SnapshotResponse }) {
  const handleFormatPct = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "N/A";
    return `${(val * 100).toFixed(2)}%`;
  };

  const getReturnColor = (val: number | null | undefined) => val && val >= 0 ? "text-green-500" : "text-red-500";
  const getVolColor = (val: number | null | undefined) => val && val < 0.15 ? "text-green-500" : (val && val < 0.20 ? "text-amber-500" : "text-red-500");
  const getSharpeColor = (val: number | null | undefined) => val && val > 1 ? "text-green-500" : (val && val > 0.5 ? "text-amber-500" : "text-red-500");

  const cards = [
    { title: "Annualized Return", value: handleFormatPct(snapshot.annualized_return), colorClass: getReturnColor(snapshot.annualized_return) },
    { title: "Portfolio Volatility", value: handleFormatPct(snapshot.portfolio_volatility), colorClass: getVolColor(snapshot.portfolio_volatility) },
    { title: "Max Drawdown", value: handleFormatPct(snapshot.max_drawdown), colorClass: "text-red-500" },
    { title: "Sharpe Ratio", value: snapshot.sharpe_ratio?.toFixed(2) ?? "N/A", colorClass: getSharpeColor(snapshot.sharpe_ratio) },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
          <Card className="bg-card border-border shadow-md h-full">
            <CardContent className="p-6 flex flex-col justify-center items-center text-center h-full">
              <span className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider mb-2">{card.title}</span>
              <span className={`text-2xl md:text-3xl font-bold tracking-tight ${card.colorClass}`}>{card.value}</span>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
