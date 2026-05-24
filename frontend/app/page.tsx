"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { MOTION } from "@/lib/motion";
import { HeroSection } from "@/components/ui/hero-section-9";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [step, setStep] = useState("login"); // login -> handshake
  const [handshakeLines, setHandshakeLines] = useState<string[]>([]);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          startHandshake();
        } else {
          setErrorMessage("Sign-up successful! Please check your email to confirm registration.");
          setIsLoading(false);
        }
      } else {
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
      toast({
        title: "Authentication failed",
        description: message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const startHandshake = async () => {
    setStep("handshake");
    const messages = [
      "Verifying credentials...",
      "Syncing market definitions...",
      "Access granted"
    ];

    for (let i = 0; i < messages.length; i++) {
      setHandshakeLines(prev => [...prev, messages[i]]);
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    await new Promise((resolve) => setTimeout(resolve, 400));
    toast({
      title: "Welcome back",
      description: "Your QuantVault session is ready.",
    });
    setIsAuthOpen(false);
    router.push("/dashboard");
  };

  const openAuth = () => {
    setIsAuthOpen(true);
    setErrorMessage("");
    setStep("login");
    setHandshakeLines([]);
  };

  return (
    <div className="relative min-h-screen bg-transparent">
      {/* Landing Hero Section */}
      <HeroSection onLoginClick={openAuth} />

      {/* Auth Dialog Modal */}
      <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
        <DialogContent className="bg-surface border-default max-w-[400px] rounded-lg p-8 select-none">
          <DialogHeader className="hidden">
            <DialogTitle>Authentication Gate</DialogTitle>
            <DialogDescription>Secure gateway to QuantVault Risk Suite</DialogDescription>
          </DialogHeader>

          <div className="w-full text-center space-y-6 pt-2">
            <AnimatePresence mode="wait">
              {step === "login" ? (
                <motion.div 
                  key="login-view"
                  variants={MOTION.pageContainer}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Monogram */}
                  <div className="text-accent font-mono text-[11px] tracking-[0.4em] uppercase">
                    Q V
                  </div>

                  {/* Heading */}
                  <div className="space-y-2">
                    <h2 className="font-serif italic text-3xl text-foreground leading-[1.1]">
                      {isSignUp ? "Create Vault Access" : "Enter Secure Vault"}
                    </h2>
                    <p className="text-[13px] font-sans text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                      {isSignUp 
                        ? "Register your credentials to initialize portfolio analytics." 
                        : "Enter credentials to unlock multi-asset risk suite."}
                    </p>
                  </div>

                  {errorMessage && (
                    <div 
                      className={`p-3.5 rounded-[6px] border text-xs text-left leading-relaxed ${
                        errorMessage.includes("successful")
                          ? "bg-[#34d399]/10 border-[#34d399]/20 text-[#34d399]"
                          : "bg-[#f87171]/10 border-[#f87171]/20 text-[#f87171]"
                      }`}
                    >
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleAuth} className="space-y-4 text-left">
                    {/* Email Input (Floating Label Pattern) */}
                    <div className="relative">
                      <input
                        id="email"
                        type="email"
                        required
                        placeholder=" "
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="peer block w-full px-3 pt-6 pb-2 bg-base border border-default rounded-[6px] text-sm text-foreground focus:border-accent/40 focus:ring-2 focus:ring-accent-dim outline-none transition-all"
                      />
                      <label 
                        htmlFor="email" 
                        className="absolute left-3 top-2 text-[10px] uppercase tracking-wider text-muted-foreground transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-muted-foreground peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-accent pointer-events-none"
                      >
                        Email Address
                      </label>
                    </div>

                    {/* Password Input (Floating Label Pattern) */}
                    <div className="relative">
                      <input
                        id="password"
                        type="password"
                        required
                        placeholder=" "
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="peer block w-full px-3 pt-6 pb-2 bg-base border border-default rounded-[6px] text-sm text-foreground focus:border-accent/40 focus:ring-2 focus:ring-accent-dim outline-none transition-all"
                      />
                      <label 
                        htmlFor="password" 
                        className="absolute left-3 top-2 text-[10px] uppercase tracking-wider text-muted-foreground transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-muted-foreground peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-accent pointer-events-none"
                      >
                        Password
                      </label>
                    </div>

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={MOTION.buttonHover}
                      whileTap={MOTION.buttonTap}
                      className="w-full h-11 bg-accent hover:bg-[#3b7de8] text-white font-sans text-sm font-medium rounded-[6px] flex items-center justify-center gap-2 transition-all shadow-none mt-6 select-none border-none"
                    >
                      {isSignUp ? "Register Account" : "Verify & Connect"}
                    </motion.button>
                  </form>

                  {/* Toggle sign in/up */}
                  <div className="text-xs text-muted-foreground">
                    {isSignUp ? (
                      <p>
                        Already have an account?{" "}
                        <button
                          onClick={() => {
                            setIsSignUp(false);
                            setErrorMessage("");
                          }}
                          className="text-accent hover:underline font-semibold"
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
                          className="text-accent hover:underline font-semibold"
                        >
                          Create an Account
                        </button>
                      </p>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="handshake-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full text-left space-y-4 py-4"
                >
                  <div className="w-full h-[2px] bg-elevated overflow-hidden">
                    <div className="w-1/2 h-full bg-accent skeleton" />
                  </div>
                  <div className="space-y-2 font-mono text-[13px]">
                    {handshakeLines.map((line, idx) => (
                      <motion.p
                        key={idx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={line.includes("granted") ? "text-[#34d399]" : "text-[var(--text-secondary)]"}
                      >
                        <span className="text-accent mr-2">[$]</span> {line}
                      </motion.p>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-8 border-t border-subtle text-center text-[11px] text-muted-foreground/50 flex flex-col sm:flex-row justify-between gap-4 select-none">
        <p>© 2026 QuantVault Inc. All rights reserved.</p>
        <div className="flex justify-center gap-6">
          <a href="#" className="hover:text-foreground transition-colors">Risk Disclosures</a>
          <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-foreground transition-colors">System Status</a>
        </div>
      </footer>
    </div>
  );
}
