import { create } from "zustand";

interface PortfolioState {
  selectedRange: "1M" | "3M" | "6M" | "1Y";
  setRange: (range: "1M" | "3M" | "6M" | "1Y") => void;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  selectedRange: "6M",
  setRange: (range) => set({ selectedRange: range }),
}));
