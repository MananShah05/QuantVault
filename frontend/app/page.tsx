"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Key, Loader2, ArrowRight, TrendingUp, BarChart2, Zap, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [step, setStep] = useState("login"); // login -> handshake -> success
  const [handshakeMessage, setHandshakeMessage] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      if (isSignUp) {
        // Sign Up Flow
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          // If auto-login is active on Supabase sign up
          startHandshake();
        } else {
          // Email confirmation is required
          setErrorMessage("Sign-up successful! Please check your email to confirm registration.");
          setIsLoading(false);
        }
      } else {
        // Sign In Flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          startHandshake();
        }
      }
        } catch (err) {
      const message = err instanceof Error ? err.message : "An authentication error occurred.";
      setErrorMessage(message);
      setIsLoading(false);
    }
  };

  const startHandshake = async () => {
    setStep("handshake");

    const messages = [
      "Initializing secure handshakes...",
      "Validating API credentials with server...",
      "Syncing market data definitions...",
      "Establishing encrypted telemetry tunnel...",
      "Auth session signed successfully!"
    ];

    for (let i = 0; i < messages.length; i++) {
      setHandshakeMessage(messages[i]);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    setStep("success");
    await new Promise((resolve) => setTimeout(resolve, 600));
    router.push("/dashboard");
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col justify-between overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Decorative Grid */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" 
      />

      {/* Header */}
      <header className="w-full max-w-container-max mx-auto px-6 md:px-12 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-3xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
            account_balance
          </span>
          <div className="flex flex-col">
            <span className="font-headline-lg text-headline-lg text-primary leading-tight font-semibold tracking-tight">QuantVault</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[9px]">Global Risk Suite</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-data-mono text-on-surface-variant hidden sm:inline-block">SYSTEM: SECURE TELEMETRY</span>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 w-full max-w-container-max mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-8 z-10">
        {/* Left Side: Copy & Features */}
        <div className="lg:col-span-7 space-y-8 text-left">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" /> Institutional Asset Management
            </span>
            <h1 className="font-display-lg text-[44px] md:text-[56px] leading-[1.1] font-bold tracking-tight text-on-background">
              Multi-Asset Portfolio <br />
              <span className="bg-gradient-to-r from-primary via-primary-container to-primary bg-clip-text text-transparent">
                Risk Analytics
              </span>
            </h1>
            <p className="text-on-surface-variant text-lg max-w-xl leading-relaxed">
              Analyze historical performance, stress test multi-asset allocations, and map cross-asset correlation profiles under unified, institutional-grade risk models.
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4"
          >
            <div className="glass-panel p-4 flex flex-col gap-2 rounded-xl">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h3 className="font-bold text-sm">Performance Attribution</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">Decompose returns, trace benchmark beta, and isolate alpha sources.</p>
            </div>
            <div className="glass-panel p-4 flex flex-col gap-2 rounded-xl">
              <BarChart2 className="w-6 h-6 text-primary" />
              <h3 className="font-bold text-sm">Stress & Drawdowns</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">Compute maximum historical drawdown peaks and underwater profiles.</p>
            </div>
            <div className="glass-panel p-4 flex flex-col gap-2 rounded-xl">
              <Zap className="w-6 h-6 text-primary" />
              <h3 className="font-bold text-sm">Cross-Asset Heatmaps</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">Visualize asset correlations, volatility trends, and risk posture.</p>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Authentication Box */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="w-full max-w-md glass-panel p-8 rounded-2xl border border-border shadow-2xl relative overflow-hidden platinum-gradient"
          >
            <AnimatePresence mode="wait">
              {step === "login" && (
                <motion.div
                  key="login-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight text-on-surface">
                      {isSignUp ? "Create Workspace Account" : "Secure Terminal Access"}
                    </h2>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {isSignUp 
                        ? "Register with email and password to initialize a new sandbox." 
                        : "Enter email and password to authenticate with the risk database."
                      }
                    </p>
                  </div>

                  {errorMessage && (
                    <div className={`p-3.5 rounded-xl border text-xs flex gap-3 items-start leading-relaxed ${
                      errorMessage.includes("successful")
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-red-500/10 border-red-500/20 text-red-400"
                    }`}>
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleAuth} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">Email Address</label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-on-surface-variant/70">
                          <Shield className="w-4 h-4" />
                        </span>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="admin@quantvault.co"
                          className="w-full pl-10 pr-4 py-3 bg-surface-container/60 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm transition-all outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">Password</label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-on-surface-variant/70">
                          <Key className="w-4 h-4" />
                        </span>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••••••"
                          className="w-full pl-10 pr-4 py-3 bg-surface-container/60 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm transition-all outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-primary hover:bg-primary-fixed-dim text-background font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md group mt-6"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing Request...
                        </>
                      ) : (
                        <>
                          {isSignUp ? "Register Account" : "Authenticate Access"}
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="pt-2 text-center text-xs text-on-surface-variant">
                    {isSignUp ? (
                      <p>
                        Already have an account?{" "}
                        <button
                          onClick={() => {
                            setIsSignUp(false);
                            setErrorMessage("");
                          }}
                          className="text-primary hover:underline font-semibold"
                        >
                          Sign In
                        </button>
                      </p>
                    ) : (
                      <p>
                        New to QuantVault?{" "}
                        <button
                          onClick={() => {
                            setIsSignUp(true);
                            setErrorMessage("");
                          }}
                          className="text-primary hover:underline font-semibold"
                        >
                          Create an Account
                        </button>
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {step === "handshake" && (
                <motion.div
                  key="handshake"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center justify-center py-16 space-y-6 text-center"
                >
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <div className="space-y-2">
                    <p className="font-bold text-lg text-on-surface">Securing Handshake</p>
                    <p className="text-sm font-data-mono text-primary animate-pulse">{handshakeMessage}</p>
                  </div>
                  <div className="w-full max-w-[200px] h-1 bg-surface-container-highest rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 4, ease: "linear" }}
                    />
                  </div>
                </motion.div>
              )}

              {step === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16 space-y-6 text-center"
                >
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center">
                    <Shield className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-2xl text-emerald-500">Access Granted</p>
                    <p className="text-xs text-on-surface-variant">Session encrypted and finalized.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-container-max mx-auto px-6 md:px-12 py-6 border-t border-border/40 text-center text-xs text-on-surface-variant flex flex-col sm:flex-row justify-between gap-4 z-10">
        <p>© 2026 QuantVault Inc. All rights reserved.</p>
        <div className="flex justify-center gap-6">
          <a href="#" className="hover:text-primary transition-colors">Risk Disclosures</a>
          <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary transition-colors">System Status</a>
        </div>
      </footer>
    </div>
  );
}
