import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

/**
 * Chat route: redirect to a new conversation ID without API call.
 * The conversation will be created lazily when the user sends the first message.
 * This matches the reference implementation pattern.
 */
export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "Chat \u2014 Forge" }] }),
  component: ChatRedirect,
});

function ChatRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    // Generate a unique ID and redirect immediately
    const newConversationId = Date.now().toString();
    navigate({ to: "/chat/$id", params: { id: newConversationId }, replace: true });
  }, [navigate]);
  return null;
}

