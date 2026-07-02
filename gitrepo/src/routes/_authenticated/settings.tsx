import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/bloomy/AppShell";
import { Loader2, Check, Sun, Moon, Palette } from "lucide-react";
import { toast } from "sonner";
import { useTheme, type Theme } from "@/components/ThemeProvider";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Forge" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [loaded, setLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setEmail(u.user.email ?? "");
      setCreatedAt(u.user.created_at ?? null);
      const { data: p } = await supabase.from("profiles").select("display_name").eq("id", u.user.id).maybeSingle();
      setDisplayName(p?.display_name ?? "");
      setLoaded(true);
    })();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", u.user.id);
      if (error) throw error;
      toast.success("Saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) {
    return (
      <AppShell><div className="flex h-64 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-text-muted" /></div></AppShell>
    );
  }

  const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "vintage", label: "Vintage", icon: Palette },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-10 md:px-10 md:py-14">
        <p className="text-[12px] uppercase tracking-[0.18em] text-text-muted">Account</p>
        <h1 className="font-display mt-2 text-[40px] leading-[1.05] tracking-tight md:text-[52px]">Settings</h1>

        {/* Theme */}
        <div className="elev-1 mt-10 rounded-2xl border border-border/60 bg-elevated/80 p-6 md:p-8">
          <div className="font-display text-xl">Appearance</div>
          <p className="mt-1 text-sm text-text-muted">Choose how Forge looks on your screen.</p>
          <div className="mt-5 flex gap-3">
            {themes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex flex-col items-center gap-2 rounded-xl border px-6 py-4 text-sm font-medium transition-all ${
                  theme === value
                    ? "border-foreground/40 bg-foreground/5 text-foreground ring-2 ring-foreground/10"
                    : "border-border/60 bg-background/40 text-text-muted hover:border-foreground/20 hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={saveProfile} className="elev-1 mt-6 rounded-2xl border border-border/60 bg-elevated/80 p-6 md:p-8">
          <div className="font-display text-xl">Profile</div>
          <p className="mt-1 text-sm text-text-muted">How you appear inside Forge.</p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">Display name</span>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="forge-input mt-1.5" />
            </label>
            <label className="block">
              <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">Email</span>
              <input value={email} disabled className="forge-input mt-1.5 opacity-60" />
            </label>
          </div>

          <div className="mt-6 flex justify-end">
            <button type="submit" disabled={busy} className="elev-1 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-95 disabled:opacity-60">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save changes
            </button>
          </div>
        </form>

        <div className="elev-1 mt-6 rounded-2xl border border-border/60 bg-elevated/80 p-6 md:p-8">
          <div className="font-display text-xl">Account</div>
          <dl className="mt-4 divide-y divide-divider text-sm">
            <div className="flex justify-between py-2.5"><dt className="text-text-muted">User ID</dt><dd className="font-mono text-[11px]">{email}</dd></div>
            {createdAt && <div className="flex justify-between py-2.5"><dt className="text-text-muted">Member since</dt><dd>{new Date(createdAt).toLocaleDateString()}</dd></div>}
          </dl>
        </div>
      </div>
    </AppShell>
  );
}
