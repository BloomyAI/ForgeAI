import { createFileRoute } from "@tanstack/react-router";
import { ChatThread } from "@/components/bloomy/ChatThread";

/** New-chat route: show the composer immediately; persist only after the first send. */
export const Route = createFileRoute("/_authenticated/chat")({
  validateSearch: (search: Record<string, unknown>) => ({
    t: typeof search.t === "string" ? search.t : undefined,
  }),
  head: () => ({ meta: [{ title: "Chat \u2014 Forge" }] }),
  component: ChatPage,
});

function ChatPage() {
  const { t } = Route.useSearch();
  return <ChatThread key={t ?? "new"} />;
}

