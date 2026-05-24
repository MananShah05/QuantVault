"use client";

import { usePortfolios } from "@/hooks/usePortfolio";
import { PortfolioCard } from "./PortfolioCard";
import { motion } from "framer-motion";
import Link from "next/link";
import { Plus } from "lucide-react";
import { MOTION } from "@/lib/motion";

export function PortfolioList() {
  const { data: portfolios, isLoading } = usePortfolios();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col space-y-3">
            <div className="skeleton h-[280px] w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (!portfolios || portfolios.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16 text-center select-none font-sans">
        <div className="w-full max-w-sm border-t border-b border-subtle py-8 space-y-4">
          <p className="text-sm font-semibold text-[var(--text-primary)]">No portfolios yet</p>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Build your first portfolio to see risk analytics and performance data.
          </p>
          <div className="pt-2">
            <Link href="/portfolio/new">
              <button className="h-9 bg-accent hover:bg-[#3b7de8] text-white font-sans text-xs font-medium px-4 rounded-[6px] transition-all inline-flex items-center gap-1.5">
                <Plus size={14} /> New Portfolio
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={MOTION.pageContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch"
    >
      {portfolios.map((portfolio) => (
        <motion.div key={portfolio.id} variants={MOTION.itemUp} className="h-full">
          <PortfolioCard portfolio={portfolio} />
        </motion.div>
      ))}
    </motion.div>
  );
}
