// Server route for fetching the current user's auth token
import { createServerFileRoute } from "@tanstack/react-start/server";
import { fetchAuth } from "../__root";

export const ServerRoute = createServerFileRoute("/api/fetchToken").methods({
   GET: async ({ request }) => {
      try {
         const { userId, token } = await fetchAuth();
         if (!userId) {
            return new Response(JSON.stringify({ token: null, message: "Unauthorized: No user Id." }), {
               status: 401,
               headers: { "Content-Type": "application/json" },
            });
         }
         if (!token) {
            return new Response(JSON.stringify({ token: null, message: "Unauthorized: No token." }), {
               status: 401,
               headers: { "Content-Type": "application/json" },
            });
         }
         return new Response(JSON.stringify({ token, message: "Token retrieved successfully" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
         });
      } catch (error) {
         return new Response(JSON.stringify({ token: null, message: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
         });
      }
   },
});
