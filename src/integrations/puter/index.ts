// Puter AI Integration
// Provides access to free AI models via Puter

declare global {
  interface Window {
    puter: any;
  }
}

export type PuterModel =
  | "claude-opus-4-8"
  | "claude-opus-4.8-fast"
  | "claude-sonnet-4-6"
  | "claude-sonnet-4"
  | "gpt-5"
  | "gpt-5-mini"
  | "gpt-4o"
  | "o3"
  | "o3-mini"
  | "z-ai/glm-5.2"
  | "z-ai/glm-5.1";

export type ModelProvider = "anthropic" | "openai" | "z-ai";

export interface ModelInfo {
  label: string;
  provider: ModelProvider;
  providerLabel: string;
}

export const PUTER_MODELS: Record<PuterModel, ModelInfo> = {
  "claude-sonnet-4": { label: "Claude Code", provider: "anthropic", providerLabel: "Anthropic" },
  "claude-opus-4-8": { label: "Claude Opus 4.8", provider: "anthropic", providerLabel: "Anthropic" },
  "claude-opus-4.8-fast": { label: "Opus 4.8 Fast", provider: "anthropic", providerLabel: "Anthropic" },
  "claude-sonnet-4-6": { label: "Sonnet 4.6", provider: "anthropic", providerLabel: "Anthropic" },
  "gpt-5": { label: "GPT-5", provider: "openai", providerLabel: "OpenAI" },
  "gpt-5-mini": { label: "GPT-5 Mini", provider: "openai", providerLabel: "OpenAI" },
  "gpt-4o": { label: "GPT-4o", provider: "openai", providerLabel: "OpenAI" },
  "o3": { label: "o3", provider: "openai", providerLabel: "OpenAI" },
  "o3-mini": { label: "o3 Mini", provider: "openai", providerLabel: "OpenAI" },
  "z-ai/glm-5.2": { label: "GLM 5.2", provider: "z-ai", providerLabel: "Z.ai" },
  "z-ai/glm-5.1": { label: "GLM 5.1", provider: "z-ai", providerLabel: "Z.ai" },
};

export const PROVIDER_GROUPS: { provider: ModelProvider; label: string; models: PuterModel[] }[] = [
  { provider: "anthropic", label: "Anthropic", models: ["claude-sonnet-4", "claude-opus-4-8", "claude-opus-4.8-fast", "claude-sonnet-4-6"] },
  { provider: "openai", label: "OpenAI", models: ["gpt-5", "gpt-5-mini", "gpt-4o", "o3", "o3-mini"] },
  { provider: "z-ai", label: "Z.ai", models: ["z-ai/glm-5.2", "z-ai/glm-5.1"] },
];

function extractErrorDetail(err: unknown): string {
  if (err === null || err === undefined) return "Unknown error";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (typeof err === "object") {
    const obj = err as Record<string, unknown>;
    if (obj.message && typeof obj.message === "string") return obj.message;
    if (obj.error) return extractErrorDetail(obj.error);
    if (obj.detail && typeof obj.detail === "string") return obj.detail;
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return String(err);
}

export class PuterAI {
  private static instance: PuterAI;
  private _signedIn = false;

  private constructor() {}

  static getInstance(): PuterAI {
    if (!PuterAI.instance) {
      PuterAI.instance = new PuterAI();
    }
    return PuterAI.instance;
  }

  isAvailable(): boolean {
    return typeof window !== "undefined" && window.puter !== undefined;
  }

  isSignedIn(): boolean {
    if (!this.isAvailable()) return false;
    return this._signedIn || window.puter.auth?.isSignedIn?.() || false;
  }

  async ensureAuth(): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error("AI is still loading — please try again in a moment.");
    }

    // Already signed in
    if (this.isSignedIn()) {
      this._signedIn = true;
      return;
    }

    // Try to sign in — this opens a popup
    try {
      await window.puter.auth.signIn({ attempt_temp_user_creation: true });
      this._signedIn = true;
    } catch (e) {
      console.error("Puter auth failed:", e);
      throw new Error("Sign-in was cancelled or failed. Please allow the pop-up to use AI.");
    }
  }

  async chat(messages: Array<{ role: string; content: string }>, model: PuterModel = "gpt-4o"): Promise<string> {
    await this.ensureAuth();

    try {
      const response = await window.puter.ai.chat(messages, { model });
      return response.message?.content || response.toString();
    } catch (error) {
      console.error("Puter AI error:", error);
      throw new Error(extractErrorDetail(error));
    }
  }

  async chatStream(
    messages: Array<{ role: string; content: string }>,
    model: PuterModel = "gpt-4o",
    onChunk: (chunk: string) => void
  ): Promise<string> {
    await this.ensureAuth();

    let fullResponse = "";

    try {
      const response = await window.puter.ai.chat(messages, { model, stream: true });

      if (!response || typeof response[Symbol.asyncIterator] !== "function") {
        if (response?.message?.content) {
          onChunk(response.message.content);
          return response.message.content;
        }
        throw new Error(extractErrorDetail(response) || "AI returned an unexpected response. Try a different model.");
      }

      for await (const chunk of response) {
        if (!chunk) continue;

        let content = "";
        if (typeof chunk === "string") {
          content = chunk;
        } else if (chunk.message?.content) {
          content = chunk.message.content;
        } else if (chunk.text) {
          content = chunk.text;
        } else if (chunk.delta?.content) {
          content = chunk.delta.content;
        } else if (chunk.error) {
          throw new Error(extractErrorDetail(chunk.error));
        }

        if (content) {
          fullResponse += content;
          onChunk(content);
        }
      }

      return fullResponse;
    } catch (error) {
      console.error("Puter AI streaming error:", error);
      throw new Error(extractErrorDetail(error));
    }
  }
}

export const puterAI = PuterAI.getInstance();
