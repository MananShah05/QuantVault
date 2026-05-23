"use client";

import { usePortfolios } from "@/hooks/usePortfolio";
import { PortfolioCard } from "./PortfolioCard";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function PortfolioList() {
  const { data: portfolios, isLoading } = usePortfolios();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col space-y-3">
            <Skeleton className="h-[280px] w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (!portfolios || portfolios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-xl bg-muted/40">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Plus className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-medium mb-2">No portfolios yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Start by building your first multi-asset portfolio to see powerful risk analytics and visualizations.
        </p>
        <Button asChild className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5">
          <Link href="/portfolio/new">Build your first portfolio &rarr;</Link>
        </Button>
      </div>
    );
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch"
    >
      {portfolios.map((portfolio) => (
        <motion.div key={portfolio.id} variants={item} className="h-full">
          <PortfolioCard portfolio={portfolio} />
        </motion.div>
      ))}
    </motion.div>
  );
}
