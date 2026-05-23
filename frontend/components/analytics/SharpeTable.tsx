"use client";

import { useState } from "react";
import { SnapshotResponse, Asset } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown } from "lucide-react";

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

  const getReturnColor = (val: number | null) => val && val >= 0 ? "text-green-500" : "text-red-500";
  const getSharpeColor = (val: number | null) => val && val > 1 ? "text-green-500" : (val && val > 0.5 ? "text-amber-500" : "text-red-500");

  const SortHeader = ({ field, label, right = false }: { field: SortField, label: string, right?: boolean }) => (
    <TableHead className={right ? "text-right cursor-pointer hover:bg-accent" : "cursor-pointer hover:bg-accent"} onClick={() => handleSort(field)}>
      <div className={`flex items-center gap-1 ${right ? "justify-end" : ""}`}>
        {label} <ArrowUpDown className="h-3 w-3 opacity-50" />
      </div>
    </TableHead>
  );

  return (
    <Card className="bg-card border-border shadow-xl h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Risk/Return Profile</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 mt-4">
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow className="border-border hover:bg-transparent">
                <SortHeader field="ticker" label="Asset" />
                <SortHeader field="ann_ret" label="Ann. Return" right />
                <SortHeader field="vol" label="Volatility" right />
                <SortHeader field="sharpe" label="Sharpe" right />
                <SortHeader field="dd" label="Max DD" right />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.ticker} className="border-border/50 hover:bg-accent/50">
                  <TableCell className="font-medium">{row.ticker}</TableCell>
                  <TableCell className={`text-right ${getReturnColor(row.ann_ret)}`}>{formatPct(row.ann_ret)}</TableCell>
                  <TableCell className="text-right">{formatPct(row.vol)}</TableCell>
                  <TableCell className={`text-right font-medium ${getSharpeColor(row.sharpe)}`}>{formatNum(row.sharpe)}</TableCell>
                  <TableCell className="text-right text-red-500 font-medium">{formatPct(row.dd)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
