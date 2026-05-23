"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarOpen } = useAppStore();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { name: "Analytics", href: "/analytics", icon: "analytics" },
    { name: "Allocation", href: "/portfolio/new", icon: "pie_chart" },
    { name: "Risk Stress", href: "/risk-stress", icon: "warning" },
  ];

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <aside className={`hidden md:flex flex-col h-screen sticky top-0 bg-surface-container-low border-r border-border transition-all duration-300 z-50 overflow-hidden ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
      <div className="flex flex-col h-full py-4">
        <div className="px-6 py-6 flex items-center justify-center min-h-[100px]">
          <div className={`flex items-center gap-3 transition-all duration-300 ${isSidebarOpen ? 'opacity-100 w-full' : 'opacity-0 w-0'}`}>
            <span className="material-symbols-outlined text-primary text-3xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
              account_balance
            </span>
            <div className={`flex flex-col ${isSidebarOpen ? 'block' : 'hidden'}`}>
              <span className="font-headline-lg text-headline-lg text-primary leading-tight">QuantVault</span>
              <h3 className="font-label-caps text-label-caps text-primary uppercase tracking-widest mt-1 text-[10px]">Global Markets</h3>
            </div>
          </div>
          {!isSidebarOpen && (
            <span className="material-symbols-outlined text-primary text-3xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
              account_balance
            </span>
          )}
        </div>
        
        <nav className="flex-1 px-2 space-y-2 mt-8 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "#" && pathname.startsWith(item.href) && item.href !== "/dashboard" && item.href !== "/portfolio/new");

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex items-center ${isSidebarOpen ? 'justify-start px-4' : 'justify-center'} py-3 rounded-lg font-label-caps text-label-caps transition-colors duration-200 ${
                  isActive
                    ? "text-primary font-bold"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
                title={item.name}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebarActiveBg"
                    className="absolute inset-0 bg-primary/10 border-r-2 border-primary rounded-lg -z-10"
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  />
                )}
                <span className="material-symbols-outlined shrink-0 z-10" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                  {item.icon}
                </span>
                {isSidebarOpen && <span className="ml-4 truncate z-10">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="px-2 py-6 border-t border-border">
          <Link href="#" className={`flex items-center ${isSidebarOpen ? 'justify-start px-4' : 'justify-center'} py-3 rounded-lg text-on-surface-variant hover:bg-accent hover:text-on-surface font-label-caps text-label-caps transition-all duration-300`} title="Support">
            <span className="material-symbols-outlined shrink-0">help</span>
            {isSidebarOpen && <span className="ml-4 truncate">Support</span>}
          </Link>
          <button 
            onClick={handleSignOut}
            className={`w-full flex items-center ${isSidebarOpen ? 'justify-start px-4' : 'justify-center'} py-3 rounded-lg text-on-surface-variant hover:bg-accent hover:text-on-surface font-label-caps text-label-caps transition-all duration-300`} 
            title="Sign Out"
          >
            <span className="material-symbols-outlined shrink-0">logout</span>
            {isSidebarOpen && <span className="ml-4 truncate">Sign Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}

