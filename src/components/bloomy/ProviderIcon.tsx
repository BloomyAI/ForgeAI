import type { ModelProvider } from "@/integrations/nvidia";

export function ProviderIcon({ provider, size = 14 }: { provider: ModelProvider; size?: number }) {
  if (provider === "moonshot") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill="currentColor" opacity="0.2"/>
      </svg>
    );
  }

  if (provider === "z-ai") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="4" fill="currentColor" opacity="0.15"/>
        <path d="M7 8h10M7 12h7M7 16h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="18" cy="8" r="2" fill="currentColor" opacity="0.5"/>
      </svg>
    );
  }

  return null;
}

