// API endpoint for header demo button. Returns the user's access token for testing serverfn integration.

import { createServerFileRoute } from "@tanstack/react-start/server";
import { fetchAuth } from "../__root";

export const ServerRoute = createServerFileRoute("/api/header-demo").methods({
   GET: async () => {
      // Call fetchAuth to get user info and token
      const { userId, token } = await fetchAuth();
      if (!userId || !token) {
         return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
         });
      }
      return new Response(JSON.stringify({ message: `Access token: ${token}` }), {
         status: 200,
         headers: { "Content-Type": "application/json" },
      });
   },
});
