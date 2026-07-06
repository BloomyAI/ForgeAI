import { createFileRoute } from "@tanstack/react-router";
import { ChatThread } from "@/components/bloomy/ChatThread";

/**
 * Chat route: render ChatThread with a generated UUID.
 * Conversation is created lazily on first message.
 */
export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "Chat \u2014 Forge" }] }),
  component: ChatRoute,
});

import { useEffect, useState } from "react";

function ChatRoute() {
  // Use search param 't' if present (for + button), otherwise generate new UUID on client
  const search = Route.useSearch();
  const [id, setId] = useState<string | null>((search as any).t || null);

  useEffect(() => {
    if (!id) {
      setId(crypto.randomUUID());
    }
  }, [id]);

  if (!id) return null; // Avoid rendering on server if we don't have an ID
  return <ChatThread key={id} id={id} />;
}

