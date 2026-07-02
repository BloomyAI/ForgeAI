import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/bloomy/AppShell";
import { Plus, Bot, Loader2, Trash2, MessageSquareText, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/agents")({
  head: () => ({ meta: [{ title: "Agents — Forge" }] }),
  component: AgentsPage,
});

type Agent = {
  id: string;
  name: string;
  role: string | null;
  system_prompt: string;
  model: string;
};

const MODELS = [
  "google/gemini-3-flash-preview",
  "google/gemini-2.5-pro",
  "google/gemini-2.5-flash",
  "openai/gpt-5-mini",
  "openai/gpt-5",
];

function AgentsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Agent[] | null>(null);
  const [editing, setEditing] = useState<Agent | "new" | null>(null);

  useEffect(() => { void load(); }, []);

  async function load() {
    const { data, error } = await supabase
      .from("agents")
      .select("id,name,role,system_prompt,model")
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems(data ?? []);
  }

  async function remove(id: string) {
    const prev = items;
    setItems((items ?? []).filter((a) => a.id !== id));
    const { error } = await supabase.from("agents").delete().eq("id", id);
    if (error) { setItems(prev); toast.error(error.message); }
  }

  async function startChat(agent: Agent) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: u.user.id, title: `Chat with ${agent.name}`, agent_id: agent.id, model: agent.model })
      .select("id")
      .single();
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/chat/$id", params: { id: data.id } });
  }

  return (
    <AppShell
      topRight={
        <button onClick={() => setEditing("new")} className="elev-1 inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground transition-all hover:opacity-95">
          <Plus className="h-3.5 w-3.5" /> New agent
        </button>
      }
    >
      <div className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-14">
        <div>
          <p className="text-[12px] uppercase tracking-[0.18em] text-text-muted">Workforce</p>
          <h1 className="font-display mt-2 text-[40px] leading-[1.05] tracking-tight md:text-[52px]">
            Your <span className="forge-gradient-text">agents</span>.
          </h1>
          <p className="mt-3 max-w-lg text-sm text-text-muted">
            Reusable assistants with their own system prompt and model. Start a chat to put one to work.
          </p>
        </div>

        <div className="mt-10">
          {items === null ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-text-muted" /></div>
          ) : items.length === 0 ? (
            <button
              onClick={() => setEditing("new")}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-elevated/40 p-12 text-text-muted transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              <Bot className="h-6 w-6 text-forge-orange" />
              <div className="font-display text-xl">Compose your first agent</div>
              <p className="text-[13px]">Give it a name, a system prompt, and a model.</p>
            </button>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((a) => (
                <div key={a.id} className="elev-1 group flex flex-col rounded-2xl border border-border/60 bg-elevated/80 p-5 transition-all hover:-translate-y-0.5 hover:elev-2">
                  <div className="flex items-start justify-between">
                    <div className="elev-1 grid h-11 w-11 place-items-center rounded-xl bg-background">
                      <Bot className="h-5 w-5 text-foreground" />
                    </div>
                    <button onClick={() => remove(a.id)} className="rounded-md p-1 text-text-muted opacity-0 transition-all hover:text-destructive group-hover:opacity-100">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button onClick={() => setEditing(a)} className="mt-4 text-left">
                    <div className="font-display text-xl text-foreground">{a.name}</div>
                    {a.role && <p className="text-[12px] text-text-muted">{a.role}</p>}
                  </button>
                  <p className="mt-3 line-clamp-3 flex-1 text-[13px] leading-relaxed text-text-muted">
                    {a.system_prompt || <span className="italic">No system prompt yet.</span>}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="rounded-full border border-border bg-background px-2 py-0.5 font-mono text-[10px] text-text-muted">{a.model.split("/")[1] ?? a.model}</span>
                    <button onClick={() => startChat(a)} className="inline-flex items-center gap-1 rounded-full bg-foreground/10 px-3 py-1 text-[11px] font-medium text-foreground hover:bg-foreground/20">
                      <MessageSquareText className="h-3 w-3" /> Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editing && <AgentEditor agent={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void load(); }} />}
    </AppShell>
  );
}

function AgentEditor({ agent, onClose, onSaved }: { agent: Agent | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(agent?.name ?? "");
  const [role, setRole] = useState(agent?.role ?? "");
  const [systemPrompt, setSystemPrompt] = useState(agent?.system_prompt ?? "");
  const [model, setModel] = useState(agent?.model ?? MODELS[0]);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      if (agent) {
        const { error } = await supabase.from("agents").update({ name, role, system_prompt: systemPrompt, model }).eq("id", agent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("agents").insert({ user_id: u.user.id, name, role, system_prompt: systemPrompt, model });
        if (error) throw error;
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="elev-3 w-full max-w-lg rounded-2xl border border-border bg-elevated p-6">
        <div className="flex items-center justify-between">
          <div className="font-display text-2xl">{agent ? "Edit agent" : "New agent"}</div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-text-muted hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        <div className="mt-5 space-y-3">
          <Labeled label="Name">
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Atlas" className="forge-input" />
          </Labeled>
          <Labeled label="Role (optional)">
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Research analyst" className="forge-input" />
          </Labeled>
          <Labeled label="System prompt">
            <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={5} placeholder="You are a research analyst who…" className="forge-input resize-y" />
          </Labeled>
          <Labeled label="Model">
            <select value={model} onChange={(e) => setModel(e.target.value)} className="forge-input">
              {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Labeled>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted">Cancel</button>
          <button type="submit" disabled={busy} className="elev-1 inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-95 disabled:opacity-60">
            {busy && <Loader2 className="h-3 w-3 animate-spin" />} {agent ? "Save" : "Create agent"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}