"use client";

import { useAppStore } from "@/store/appStore";
import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import { usePortfolios } from "@/hooks/usePortfolio";
import Link from "next/link";

export function Navbar() {
  const { toggleSidebar } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: portfolios = [] } = usePortfolios();
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

  const filteredPortfolios = searchQuery
    ? portfolios.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];
  
  return (
    <header className="w-full top-0 sticky bg-background/80 backdrop-blur-xl border-b border-border shadow-md dark:shadow-[0_20px_40px_rgba(0,0,0,0.5)] z-40 transition-all duration-300 ease-in-out">
      <div className="flex justify-between items-center px-6 h-16 w-full max-w-container-max mx-auto">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="p-2 -ml-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-accent"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="font-headline-md text-headline-md text-primary tracking-tight hidden sm:block">PLATINUM INSTITUTIONAL</h1>
          
          <div ref={searchRef} className="relative hidden lg:flex items-center bg-surface-container rounded-full px-4 py-1.5 border border-border ml-4">
            <span className="material-symbols-outlined text-on-surface-variant text-sm mr-2">search</span>
            <input 
              className="bg-transparent border-none focus:ring-0 text-body-md font-body-md w-64 placeholder:text-on-surface-variant/60 outline-none" 
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
              <div className="absolute top-12 left-0 w-full bg-surface-container-high border border-border rounded-xl shadow-xl z-50 py-2 glass-panel">
                {filteredPortfolios.map((portfolio) => (
                  <Link
                    key={portfolio.id}
                    href={`/portfolio/${portfolio.id}`}
                    onClick={() => {
                      setSearchQuery("");
                      setIsOpen(false);
                    }}
                    className="block px-4 py-2 text-sm text-on-surface hover:bg-primary/10 transition-colors font-body-md"
                  >
                    {portfolio.name}
                  </Link>
                ))}
              </div>
            )}
            {isOpen && searchQuery && filteredPortfolios.length === 0 && (
              <div className="absolute top-12 left-0 w-full bg-surface-container-high border border-border rounded-xl shadow-xl z-50 py-3 px-4 glass-panel text-xs text-on-surface-variant font-body-md">
                No portfolios found.
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-on-surface-variant hover:text-primary transition-all p-2 rounded-full hover:bg-accent"
            title="Toggle Theme"
          >
            {mounted ? (
              <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            ) : (
              <span className="material-symbols-outlined w-[24px] h-[24px] inline-block"></span>
            )}
          </button>
          <button className="text-on-surface-variant hover:text-primary transition-all">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="text-on-surface-variant hover:text-primary transition-all">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/40 shrink-0">
            <img 
              alt="Executive Avatar" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCX3JM5YaKF9oOl7gCoExIIc_zkLLeDRW7ofW8s4DItGTbMvrvoQSwQiNR17HXjUbWnbMQP-KiDz3X6IqgmT22gE-lOkcFn2lIy3cnomc4Egi0elgpB_75OEIKRgO9DdBn1K5PrVMYtnhPWECKQTgqISHwrfeMFApdMsDStwMV207tylMEF9EeFfYokpu6-Yp6s2MYoVaQr5KUfr0A5AVWWnHUEKQp0Vh4sJ5F8vglbLEM9dcjcHkuRUWkUdH9OBpuT-mUZNPal7Vqc" 
            />
          </div>
        </div>
      </div>
    </header>
  );
}
