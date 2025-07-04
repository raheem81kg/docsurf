// Server route for fetching the current user's auth token
import { createServerFileRoute } from "@tanstack/react-start/server";
import { fetchAuth } from "../__root";
import { fetchToken } from "../__root";

export const ServerRoute = createServerFileRoute("/api/fetchToken").methods({
   GET: async ({ request }) => {
      try {
         const { userId } = await fetchAuth();
         if (!userId) {
            return new Response(JSON.stringify({ token: null }), {
               status: 200,
               headers: { "Content-Type": "application/json" },
            });
         }
         const token = await fetchToken();
         if (!token) {
            return new Response(JSON.stringify({ token: null }), {
               status: 200,
               headers: { "Content-Type": "application/json" },
            });
         }
         return new Response(JSON.stringify({ token }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
         });
      } catch (error) {
         return new Response(JSON.stringify({ token: null }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
         });
      }
   },
});
