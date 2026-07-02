import { createFileRoute } from "@tanstack/react-router";
import { createSupabaseContext } from "@supabase/server";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/admin/users")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { data: ctx, error } = await createSupabaseContext<Database>(request, { auth: "user" });
        if (error) {
          return Response.json({ message: error.message }, { status: error.status });
        }

        // Check if user is admin, dev, or founder
        const { data: profile } = await ctx.supabase
          .from("profiles")
          .select("role")
          .eq("id", ctx.userClaims!.id)
          .single();

        if (!profile || !["admin", "dev", "founder"].includes(profile.role || "")) {
          return Response.json({ message: "Unauthorized" }, { status: 403 });
        }

        // Get all users with their profiles
        const { data: users, error: dbError } = await ctx.supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (dbError) {
          return Response.json({ message: dbError.message }, { status: 500 });
        }

        return Response.json(users ?? []);
      },

      PATCH: async ({ request }) => {
        const { data: ctx, error } = await createSupabaseContext<Database>(request, { auth: "user" });
        if (error) {
          return Response.json({ message: error.message }, { status: error.status });
        }

        // Check if user is founder (only founder can change roles)
        const { data: profile } = await ctx.supabase
          .from("profiles")
          .select("role")
          .eq("id", ctx.userClaims!.id)
          .single();

        if (!profile || profile.role !== "founder") {
          return Response.json({ message: "Unauthorized - only founders can change roles" }, { status: 403 });
        }

        const body = await request.json().catch(() => ({}));
        const { userId, role } = body as { userId?: string; role?: "user" | "dev" | "admin" | "founder" };

        if (!userId || !role) {
          return Response.json({ message: "userId and role are required" }, { status: 400 });
        }

        const { data, error: dbError } = await ctx.supabase
          .from("profiles")
          .update({ role })
          .eq("id", userId)
          .select()
          .single();

        if (dbError) {
          return Response.json({ message: dbError.message }, { status: 500 });
        }

        return Response.json(data);
      },
    },
  },
});
