"use client";

import { useAppStore } from "@/store/appStore";
import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import { usePortfolios, usePortfolio } from "@/hooks/usePortfolio";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Search, Bell, Sun, Moon, Settings, Menu } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

export function Navbar() {
  const { toggleSidebar } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [userInitials, setUserInitials] = useState("QV");
  
  const pathname = usePathname();
  const params = useParams();
  const portfolioId = params?.id as string | undefined;
  
  const { data: portfolios = [] } = usePortfolios();
  const { data: currentPortfolio } = usePortfolio(portfolioId || "");
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted || !data.user) return;

      const metadata = data.user.user_metadata || {};
      const displayName = String(metadata.fullName || metadata.name || data.user.email || "QuantVault");
      const initials = displayName
        .split(/[\s@.]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");

      setUserInitials(initials || "QV");
    });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredPortfolios = searchQuery
    ? portfolios.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  // Breadcrumbs text
  const getBreadcrumbs = () => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) return "Terminal";
    
    const elements: React.ReactNode[] = [];
    elements.push(
      <Link key="dashboard" href="/dashboard" className="hover:text-[var(--text-primary)] transition-colors">
        Dashboard
      </Link>
    );

    if (parts[0] === "portfolio" && parts[1] === "new") {
      elements.push(<span key="sep1" className="text-[var(--text-muted)]">/</span>);
      elements.push(<span key="new" className="text-[var(--text-secondary)]">New Portfolio</span>);
    } else if (parts[0] === "portfolio" && portfolioId) {
      elements.push(<span key="sep1" className="text-[var(--text-muted)]">/</span>);
      elements.push(
        <span key="portfolio-name" className="text-[var(--text-primary)] font-sans font-medium">
          {currentPortfolio?.name || "Portfolio"}
        </span>
      );
      if (parts[2] === "report") {
        elements.push(<span key="sep2" className="text-[var(--text-muted)]">/</span>);
        elements.push(<span key="report" className="text-[var(--text-secondary)]">Report</span>);
      }
    } else if (parts[0] === "risk-stress") {
      elements.push(<span key="sep1" className="text-[var(--text-muted)]">/</span>);
      elements.push(<span key="stress" className="text-[var(--text-primary)]">Risk Stress</span>);
    } else if (parts[0] === "analytics") {
      elements.push(<span key="sep1" className="text-[var(--text-muted)]">/</span>);
      elements.push(<span key="analytics" className="text-[var(--text-primary)]">Attribution</span>);
    } else if (parts[0] === "settings") {
      elements.push(<span key="sep1" className="text-[var(--text-muted)]">/</span>);
      elements.push(<span key="settings" className="text-[var(--text-primary)]">Settings</span>);
    }

    return (
      <div className="flex items-center gap-2 text-[13px] font-sans text-[var(--text-secondary)]">
        {elements}
      </div>
    );
  };
  
  return (
    <header className="w-full top-0 sticky h-14 bg-surface border-b border-subtle z-40 select-none">
      <div className="flex justify-between items-center px-6 h-full w-full">
        {/* Left Section: Menu Toggle + Breadcrumbs */}
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="p-1.5 -ml-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded hover:bg-elevated md:hidden"
          >
            <Menu size={16} />
          </button>
          
          {getBreadcrumbs()}
        </div>

        {/* Center Section: Search Bar */}
        <div ref={searchRef} className="relative hidden lg:flex items-center bg-base border border-default focus-within:border-accent/40 rounded-[6px] px-3 py-1.5 w-[320px] transition-all focus-within:ring-2 focus-within:ring-accent-dim focus-within:ring-offset-0">
          <Search size={14} className="text-[var(--text-muted)] mr-2 shrink-0" />
          <input 
            className="bg-transparent border-none text-[13px] font-sans w-full placeholder:text-[var(--text-muted)] outline-none text-[var(--text-primary)]" 
            placeholder="Search portfolios..." 
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />
          {isOpen && filteredPortfolios.length > 0 && (
            <div className="absolute top-10 left-0 right-0 bg-overlay border border-default rounded-lg shadow-2xl z-50 py-2.5 px-1">
              {filteredPortfolios.map((portfolio) => (
                <Link
                  key={portfolio.id}
                  href={`/portfolio/${portfolio.id}`}
                  onClick={() => {
                    setSearchQuery("");
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-between px-3 py-2 text-[13px] hover:bg-elevated transition-colors rounded-md font-sans text-[var(--text-primary)] group"
                >
                  <span>{portfolio.name}</span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)] group-hover:text-accent">
                    {portfolio.assets.map(a => a.ticker).slice(0, 3).join(", ")}
                  </span>
                </Link>
              ))}
            </div>
          )}
          {isOpen && searchQuery && filteredPortfolios.length === 0 && (
            <div className="absolute top-10 left-0 right-0 bg-overlay border border-default rounded-lg shadow-2xl z-50 py-3 px-4 text-xs text-[var(--text-secondary)] font-sans">
              No portfolios found.
            </div>
          )}
        </div>

        {/* Right Section: Actions + Avatar */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              const nextTheme = theme === 'dark' ? 'light' : 'dark';
              setTheme(nextTheme);
              toast({
                title: "Theme updated",
                description: `Switched to ${nextTheme} mode.`,
              });
            }}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1.5 rounded hover:bg-elevated"
            title="Toggle Theme"
          >
            {mounted ? (
              theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />
            ) : (
              <div className="w-4 h-4" />
            )}
          </button>
          
          <button
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1.5 rounded hover:bg-elevated"
            onClick={() => toast({ title: "No new alerts", description: "Portfolio notifications will appear here." })}
            title="Notifications"
          >
            <Bell size={16} />
          </button>

          <Link href="/settings" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1.5 rounded hover:bg-elevated" title="Settings">
            <Settings size={16} />
          </Link>

          {/* User Avatar */}
          <Link href="/settings" className="w-7 h-7 rounded-full bg-elevated border border-default shrink-0 flex items-center justify-center select-none font-sans font-medium text-[11px] text-[var(--text-primary)] tracking-wider cursor-pointer hover:border-strong transition-colors" title="Profile settings">
            {userInitials}
          </Link>
        </div>
      </div>
    </header>
  );
}
