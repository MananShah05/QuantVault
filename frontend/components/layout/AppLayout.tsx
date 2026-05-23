"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLandingPage = pathname === "/";
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    // Check session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setIsAuthenticated(!!session);
        // If already logged in and on the landing page, auto-redirect to dashboard
        if (session && isLandingPage) {
          router.push("/dashboard");
        }
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setIsAuthenticated(!!session);
        if (!session && !isLandingPage) {
          router.push("/");
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isLandingPage, router]);

  // If loading the auth state, show a clean, premium spinner
  if (isAuthenticated === null && !isLandingPage) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <span className="text-xs font-data-mono text-on-surface-variant uppercase tracking-wider">Securing Terminal Session...</span>
      </div>
    );
  }

  // If not authenticated and trying to view dashboard/portfolios, redirect to login
  if (isAuthenticated === false && !isLandingPage) {
    return null; // The redirect is triggered in useEffect
  }

  // If landing page, just render it directly
  if (isLandingPage) {
    return <div className="min-h-screen w-full">{children}</div>;
  }

  // Otherwise, render full authenticated dashboard layout
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
