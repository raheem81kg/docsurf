export function getClientAppUrl() {
   if (import.meta.env.VITE_VERCEL_ENV === "production" || import.meta.env.PROD) {
      return "https://docsurf.ai";
   }

   return "http://localhost:3001";
}
