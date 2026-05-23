"use client";

import { PortfolioListItem } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useDeletePortfolio } from "@/hooks/usePortfolio";

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

export function PortfolioCard({ portfolio }: { portfolio: PortfolioListItem }) {
  const { mutate: deletePortfolio } = useDeletePortfolio();

  const handleFormatPct = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "N/A";
    return `${(val * 100).toFixed(2)}%`;
  };

  const snapshot = portfolio.latest_snapshot;
  
  const getReturnColor = (val: number | null | undefined) => val && val >= 0 ? "text-green-500" : "text-red-500";
  const getVolColor = (val: number | null | undefined) => val && val < 0.15 ? "text-green-500" : (val && val < 0.20 ? "text-amber-500" : "text-red-500");
  const getSharpeColor = (val: number | null | undefined) => val && val > 1 ? "text-green-500" : (val && val > 0.5 ? "text-amber-500" : "text-red-500");

  return (
    <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }} className="h-full">
      <Card className="h-full flex flex-col shadow-md overflow-hidden bg-card border-border hover:border-primary/50 transition-colors duration-300">
        <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-xl font-semibold leading-tight">{portfolio.name}</CardTitle>
            <div className="mt-2 flex flex-wrap gap-1">
              {portfolio.assets.map(a => (
                <Badge key={a.ticker} variant="secondary" className="bg-secondary/20 text-secondary-foreground">
                  {a.ticker}
                </Badge>
              ))}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 ml-2" onClick={() => deletePortfolio(portfolio.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 pb-4">
          <div className="text-sm text-muted-foreground mb-6">
            {portfolio.last_computed ? `Updated ${formatTimeAgo(portfolio.last_computed)}` : "Never computed"}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-auto">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Ann. Return</span>
              <span className={`font-semibold ${getReturnColor(snapshot?.annualized_return)}`}>
                {handleFormatPct(snapshot?.annualized_return)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Volatility</span>
              <span className={`font-semibold ${getVolColor(snapshot?.portfolio_volatility)}`}>
                {handleFormatPct(snapshot?.portfolio_volatility)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Max DD</span>
              <span className="font-semibold text-red-500">
                {handleFormatPct(snapshot?.max_drawdown)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Sharpe</span>
              <span className={`font-semibold ${getSharpeColor(snapshot?.sharpe_ratio)}`}>
                {snapshot?.sharpe_ratio?.toFixed(2) ?? "N/A"}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2 border-t border-border bg-muted/20">
          <Button asChild className="w-full shadow-lg hover:shadow-primary/20 transition-all" variant="default">
            <Link href={`/portfolio/${portfolio.id}`}>View Analytics</Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
