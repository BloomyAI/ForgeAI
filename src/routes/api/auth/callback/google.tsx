import { useEffect } from "react";
import { useNavigate, createFileRoute } from "@tanstack/react-router";

/**
 * Callback route for Google OAuth.
 * After Supabase redirects here, we forward the user to the dashboard.
 */
export const Route = createFileRoute("/api/auth/callback/google")({
  component: () => {
    const navigate = useNavigate();
    useEffect(() => {
      navigate({ to: "/dashboard", replace: true });
    }, [navigate]);
    return null;
  },
});

