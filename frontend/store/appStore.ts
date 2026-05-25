import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserPreferences {
  emailReports: boolean;
  riskAlerts: boolean;
  computeCompleteAlerts: boolean;
  compactTables: boolean;
  reduceMotion: boolean;
  defaultView: "dashboard" | "analytics" | "risk-stress";
  autoRefresh: boolean;
  refreshInterval: number;
  currency: "USD" | "EUR" | "GBP" | "INR";
  riskFreeRate: number;
}

interface AppState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  preferences: UserPreferences;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
}

export const defaultPreferences: UserPreferences = {
  emailReports: true,
  riskAlerts: true,
  computeCompleteAlerts: true,
  compactTables: false,
  reduceMotion: false,
  defaultView: "dashboard",
  autoRefresh: true,
  refreshInterval: 15,
  currency: "USD",
  riskFreeRate: 6.5,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
      preferences: defaultPreferences,
      updatePreferences: (preferences) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...preferences,
          },
        })),
      resetPreferences: () => set({ preferences: defaultPreferences }),
    }),
    {
      name: "riskmatrix-app-settings",
    }
  )
);
