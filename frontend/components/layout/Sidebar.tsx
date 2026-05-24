"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { 
  LayoutDashboard, 
  TrendingUp, 
  Activity, 
  Plus, 
  Settings, 
  LogOut, 
  PanelLeftClose, 
  PanelLeftOpen 
} from "lucide-react";
import { MOTION } from "@/lib/motion";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarOpen, toggleSidebar } = useAppStore();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Analytics", href: "/analytics", icon: TrendingUp },
    { name: "Risk Stress", href: "/risk-stress", icon: Activity },
    { name: "New Portfolio", href: "/portfolio/new", icon: Plus },
  ];

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <motion.aside 
      initial={isSidebarOpen ? "open" : "closed"}
      animate={isSidebarOpen ? "open" : "closed"}
      variants={MOTION.sidebarExpand}
      className="hidden md:flex flex-col h-screen sticky top-0 bg-surface border-r border-subtle transition-colors duration-300 z-50 overflow-hidden select-none"
    >
      <div className="flex flex-col h-full py-4 justify-between">
        <div>
          {/* Logo Area */}
          <div className="h-14 px-6 flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-accent shrink-0" />
            <AnimatePresence mode="wait">
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="font-sans font-bold text-[13px] tracking-[0.2em] text-[var(--text-primary)] whitespace-nowrap"
                >
                  QUANTVAULT
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          
          {/* Navigation Section */}
          <div className="mt-6">
            {isSidebarOpen && (
              <p className="px-6 text-[10px] font-sans font-medium tracking-[0.15em] text-[var(--text-muted)] uppercase mb-4">
                NAVIGATION
              </p>
            )}
            <nav className="px-3 space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && item.href !== "/portfolio/new" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`relative h-10 flex items-center ${isSidebarOpen ? 'justify-start px-3' : 'justify-center'} rounded-md transition-colors duration-150 font-sans text-[13px] font-medium group ${
                      isActive 
                        ? "text-[var(--text-primary)]" 
                        : "text-[var(--text-secondary)] hover:bg-elevated hover:text-[var(--text-primary)]"
                    }`}
                    title={item.name}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        transition={MOTION.navIndicator.transition}
                        className="absolute left-0 top-0 bottom-0 w-[2px] bg-accent bg-opacity-100 rounded-none z-10"
                      />
                    )}
                    {isActive && (
                      <div className="absolute inset-0 bg-accent bg-opacity-[0.06] rounded-md -z-10" />
                    )}
                    <Icon 
                      size={16} 
                      className={`shrink-0 z-10 ${isActive ? "text-accent" : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors"}`} 
                    />
                    {isSidebarOpen && (
                      <span className="ml-3 truncate z-10">{item.name}</span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Area */}
        <div className="px-3 space-y-2">
          <Link 
            href="/settings" 
            className={`h-10 flex items-center ${isSidebarOpen ? 'justify-start px-3' : 'justify-center'} rounded-md text-[var(--text-muted)] hover:bg-elevated hover:text-[var(--text-primary)] font-sans text-[13px] font-medium transition-colors`} 
            title="Settings"
          >
            <Settings size={16} className="shrink-0" />
            {isSidebarOpen && <span className="ml-3 truncate">Settings</span>}
          </Link>
          <button 
            onClick={handleSignOut}
            className={`w-full h-10 flex items-center ${isSidebarOpen ? 'justify-start px-3' : 'justify-center'} rounded-md text-[var(--text-muted)] hover:bg-elevated hover:text-[var(--text-primary)] font-sans text-[13px] font-medium transition-colors`} 
            title="Sign Out"
          >
            <LogOut size={16} className="shrink-0" />
            {isSidebarOpen && <span className="ml-3 truncate">Sign Out</span>}
          </button>

          {/* Collapse Toggle */}
          <div className="flex justify-end pt-4 border-t border-subtle mt-4">
            <button
              onClick={toggleSidebar}
              className="w-7 h-7 bg-elevated border border-default flex items-center justify-center hover:border-strong transition-colors rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              {isSidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
            </button>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
