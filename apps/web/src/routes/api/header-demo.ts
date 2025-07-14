// API endpoint for header demo button. Returns basic JSON data for testing serverfn integration.

import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute("/api/header-demo").methods({
   GET: async () => {
      return new Response(JSON.stringify({ message: "Hello from header-demo!" }), {
         status: 200,
         headers: { "Content-Type": "application/json" },
      });
   },
});
