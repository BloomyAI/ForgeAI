import { useEffect } from "react";
import { useNavigate, createFileRoute } from "@tanstack/react-router";

/**
 * Callback route for Discord OAuth.
 * Supabase will redirect the user here after a successful sign‑in.
 * For now we simply forward the user to the dashboard.
 * If you need to process tokens from the query string, you can do so here.
 */
export const Route = createFileRoute("/api/auth/callback/discord")({
  component: () => {
    const navigate = useNavigate();
    useEffect(() => {
      // Immediately navigate to the dashboard after the redirect.
      navigate({ to: "/dashboard", replace: true });
    }, [navigate]);
    return null;
  },
});

