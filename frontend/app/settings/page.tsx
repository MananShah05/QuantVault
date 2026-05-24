"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useTheme } from "next-themes";
import {
  Bell,
  Check,
  Loader2,
  Monitor,
  Moon,
  RotateCcw,
  Save,
  Shield,
  Sun,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useAppStore, type UserPreferences } from "@/store/appStore";

type ProfileForm = {
  fullName: string;
  age: string;
  phone: string;
  location: string;
  occupation: string;
  bio: string;
};

const emptyProfile: ProfileForm = {
  fullName: "",
  age: "",
  phone: "",
  location: "",
  occupation: "",
  bio: "",
};

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-[10px] uppercase tracking-[0.14em] text-text-muted">
        {label}
      </Label>
      {children}
    </div>
  );
}

function ToggleRow({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-md border border-subtle bg-base/40 px-4 py-3">
      <span>
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        <span className="mt-1 block text-xs leading-relaxed text-text-secondary">{description}</span>
      </span>
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input
          checked={checked}
          className="peer sr-only"
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
        <span className="absolute inset-0 rounded-full border border-default bg-elevated transition-colors peer-checked:border-accent/50 peer-checked:bg-accent" />
        <span className="absolute left-1 h-4 w-4 rounded-full bg-text-secondary transition-transform peer-checked:translate-x-5 peer-checked:bg-white" />
      </span>
    </label>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { preferences, resetPreferences, updatePreferences } = useAppStore();
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return;

      if (error || !data.user) {
        setIsLoadingProfile(false);
        toast({
          title: "Profile unavailable",
          description: "Your session could not be read. Please sign in again.",
          variant: "destructive",
        });
        return;
      }

      const metadata = data.user.user_metadata || {};
      setEmail(data.user.email || "");
      setProfile({
        fullName: String(metadata.fullName || metadata.name || ""),
        age: metadata.age ? String(metadata.age) : "",
        phone: String(metadata.phone || ""),
        location: String(metadata.location || ""),
        occupation: String(metadata.occupation || ""),
        bio: String(metadata.bio || ""),
      });
      setIsLoadingProfile(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const profileCompletion = useMemo(() => {
    const fields = [profile.fullName, profile.age, profile.phone, profile.location, profile.occupation];
    const complete = fields.filter(Boolean).length;
    return Math.round((complete / fields.length) * 100);
  }, [profile]);

  const updateProfileField = (field: keyof ProfileForm, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const saveProfile = async () => {
    const age = profile.age.trim() ? Number(profile.age) : null;
    if (age !== null && (!Number.isFinite(age) || age < 0 || age > 120)) {
      toast({
        title: "Check the age field",
        description: "Age should be a number between 0 and 120.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingProfile(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        fullName: profile.fullName.trim(),
        name: profile.fullName.trim(),
        age,
        phone: profile.phone.trim(),
        location: profile.location.trim(),
        occupation: profile.occupation.trim(),
        bio: profile.bio.trim(),
      },
    });
    setIsSavingProfile(false);

    if (error) {
      toast({
        title: "Profile not saved",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Profile updated",
      description: "Your personal details have been saved.",
    });
  };

  const savePreferences = () => {
    toast({
      title: "Settings saved",
      description: "Your workspace preferences are stored on this device.",
    });
  };

  const resetAllPreferences = () => {
    resetPreferences();
    setTheme("dark");
    toast({
      title: "Settings reset",
      description: "Preferences are back to the QuantVault defaults.",
    });
  };

  const sendPasswordReset = async () => {
    if (!email) {
      toast({
        title: "No email found",
        description: "Your account email is unavailable for password reset.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setIsSendingReset(false);

    if (error) {
      toast({
        title: "Reset email failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Password reset sent",
      description: `A reset link was sent to ${email}.`,
    });
  };

  const setPreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    updatePreferences({ [key]: value } as Partial<UserPreferences>);
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-8 px-8 py-8 font-sans text-text-secondary">
      <div className="flex flex-col gap-4 border-b border-subtle pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
            Account Control
          </p>
          <h1 className="mt-2 font-serif text-3xl italic text-foreground">Settings</h1>
          <p className="mt-2 max-w-2xl text-sm text-text-secondary">
            Manage your profile, notifications, workspace defaults, and account security.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-subtle bg-surface px-3 py-2 font-mono text-[11px] text-text-secondary">
          <Shield size={14} className="text-accent" />
          {email || "Session secured"}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <section className="rounded-lg border border-subtle bg-surface p-6">
          <div className="flex items-start justify-between gap-4 border-b border-subtle pb-5">
            <div>
              <div className="flex items-center gap-2 text-foreground">
                <User size={17} className="text-accent" />
                <h2 className="text-base font-semibold">Profile Management</h2>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                These details are saved to your Supabase user metadata and can be used across the dashboard experience.
              </p>
            </div>
            <div className="rounded-md border border-default bg-base px-3 py-2 text-right">
              <p className="font-mono text-lg font-semibold text-foreground">{profileCompletion}%</p>
              <p className="font-mono text-[9px] uppercase tracking-wider text-text-muted">Complete</p>
            </div>
          </div>

          {isLoadingProfile ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-accent" />
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field id="fullName" label="Full name">
                <Input
                  id="fullName"
                  onChange={(event) => updateProfileField("fullName", event.target.value)}
                  placeholder="Your name"
                  value={profile.fullName}
                />
              </Field>

              <Field id="age" label="Age">
                <Input
                  id="age"
                  inputMode="numeric"
                  min={0}
                  max={120}
                  onChange={(event) => updateProfileField("age", event.target.value)}
                  placeholder="28"
                  type="number"
                  value={profile.age}
                />
              </Field>

              <Field id="phone" label="Phone">
                <Input
                  id="phone"
                  onChange={(event) => updateProfileField("phone", event.target.value)}
                  placeholder="+1 555 0100"
                  value={profile.phone}
                />
              </Field>

              <Field id="location" label="Location">
                <Input
                  id="location"
                  onChange={(event) => updateProfileField("location", event.target.value)}
                  placeholder="New York, US"
                  value={profile.location}
                />
              </Field>

              <Field id="occupation" label="Role">
                <Input
                  id="occupation"
                  onChange={(event) => updateProfileField("occupation", event.target.value)}
                  placeholder="Portfolio manager"
                  value={profile.occupation}
                />
              </Field>

              <Field id="email" label="Account email">
                <Input id="email" readOnly value={email} />
              </Field>

              <div className="md:col-span-2">
                <Field id="bio" label="Profile note">
                  <textarea
                    id="bio"
                    className="min-h-[96px] w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    onChange={(event) => updateProfileField("bio", event.target.value)}
                    placeholder="Add a short note about your investment focus."
                    value={profile.bio}
                  />
                </Field>
              </div>

              <div className="flex justify-end md:col-span-2">
                <Button onClick={saveProfile} disabled={isSavingProfile}>
                  {isSavingProfile ? <Loader2 className="animate-spin" /> : <Save />}
                  Save Profile
                </Button>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-lg border border-subtle bg-surface p-6">
            <div className="flex items-center gap-2 text-foreground">
              <Monitor size={17} className="text-accent" />
              <h2 className="text-base font-semibold">Appearance</h2>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                { label: "Dark", value: "dark", icon: Moon },
                { label: "Light", value: "light", icon: Sun },
                { label: "System", value: "system", icon: Monitor },
              ].map((option) => {
                const Icon = option.icon;
                const isActive = theme === option.value;
                return (
                  <button
                    key={option.value}
                    className={`flex h-20 flex-col items-center justify-center gap-2 rounded-md border text-xs font-semibold transition-colors ${
                      isActive
                        ? "border-accent/50 bg-accent-dim text-accent"
                        : "border-subtle bg-base/40 text-text-secondary hover:border-default hover:text-foreground"
                    }`}
                    onClick={() => {
                      setTheme(option.value);
                      toast({
                        title: "Theme updated",
                        description: `${option.label} appearance is active.`,
                      });
                    }}
                    type="button"
                  >
                    <Icon size={16} />
                    {option.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-5 space-y-3">
              <ToggleRow
                checked={preferences.compactTables}
                description="Use tighter rows in data-heavy tables."
                label="Compact tables"
                onChange={(checked) => setPreference("compactTables", checked)}
              />
              <ToggleRow
                checked={preferences.reduceMotion}
                description="Reduce decorative motion where the interface supports it."
                label="Reduced motion"
                onChange={(checked) => setPreference("reduceMotion", checked)}
              />
            </div>
          </section>

          <section className="rounded-lg border border-subtle bg-surface p-6">
            <div className="flex items-center gap-2 text-foreground">
              <Bell size={17} className="text-accent" />
              <h2 className="text-base font-semibold">Notifications</h2>
            </div>
            <div className="mt-5 space-y-3">
              <ToggleRow
                checked={preferences.emailReports}
                description="Receive exported report summaries by email."
                label="Email reports"
                onChange={(checked) => setPreference("emailReports", checked)}
              />
              <ToggleRow
                checked={preferences.riskAlerts}
                description="Notify when drawdown or volatility crosses risk limits."
                label="Risk alerts"
                onChange={(checked) => setPreference("riskAlerts", checked)}
              />
              <ToggleRow
                checked={preferences.computeCompleteAlerts}
                description="Show a toast when portfolio computations finish."
                label="Computation alerts"
                onChange={(checked) => setPreference("computeCompleteAlerts", checked)}
              />
            </div>
          </section>
        </aside>
      </div>

      <section className="rounded-lg border border-subtle bg-surface p-6">
        <div className="flex flex-col gap-3 border-b border-subtle pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Workspace Defaults</h2>
            <p className="mt-1 text-xs text-text-secondary">
              Local preferences for how QuantVault should open and refresh on this device.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetAllPreferences}>
              <RotateCcw />
              Reset
            </Button>
            <Button onClick={savePreferences}>
              <Check />
              Save Settings
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Field id="defaultView" label="Default view">
            <select
              id="defaultView"
              className="h-9 w-full rounded-md border border-input bg-base px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onChange={(event) => setPreference("defaultView", event.target.value as UserPreferences["defaultView"])}
              value={preferences.defaultView}
            >
              <option value="dashboard">Dashboard</option>
              <option value="analytics">Analytics</option>
              <option value="risk-stress">Risk Stress</option>
            </select>
          </Field>

          <Field id="currency" label="Base currency">
            <select
              id="currency"
              className="h-9 w-full rounded-md border border-input bg-base px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onChange={(event) => setPreference("currency", event.target.value as UserPreferences["currency"])}
              value={preferences.currency}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="INR">INR</option>
            </select>
          </Field>

          <Field id="refreshInterval" label="Refresh interval">
            <select
              id="refreshInterval"
              className="h-9 w-full rounded-md border border-input bg-base px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onChange={(event) => setPreference("refreshInterval", Number(event.target.value))}
              value={preferences.refreshInterval}
            >
              <option value={5}>5 min</option>
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={60}>60 min</option>
            </select>
          </Field>

          <Field id="riskFreeRate" label="Risk-free rate">
            <Input
              id="riskFreeRate"
              min={0}
              onChange={(event) => setPreference("riskFreeRate", Number(event.target.value))}
              step="0.1"
              type="number"
              value={preferences.riskFreeRate}
            />
          </Field>

          <div className="md:col-span-2 lg:col-span-4">
            <ToggleRow
              checked={preferences.autoRefresh}
              description="Refresh portfolio summaries automatically while you are signed in."
              label="Auto-refresh market data"
              onChange={(checked) => setPreference("autoRefresh", checked)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-subtle bg-surface p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Account Security</h2>
            <p className="mt-1 text-xs text-text-secondary">
              Send a password reset email to the signed-in account.
            </p>
          </div>
          <Button variant="outline" onClick={sendPasswordReset} disabled={isSendingReset}>
            {isSendingReset ? <Loader2 className="animate-spin" /> : <Shield />}
            Send Reset Link
          </Button>
        </div>
      </section>
    </div>
  );
}
