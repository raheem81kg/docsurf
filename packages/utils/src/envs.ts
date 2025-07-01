export function getAppUrl() {
   if (process.env.VITE_VERCEL_ENV === "production" || process.env.VITE_NODE_ENV === "production") {
      // return "https://docsurf.ai";
      return "https://docsurf.vercel.app";
   }

   if (process.env.VITE_VERCEL_ENV === "preview") {
      return `https://${process.env.VITE_VERCEL_URL}`;
   }

   return "http://localhost:3001";
}

export function getEmailUrl() {
   if (process.env.VITE_NODE_ENV === "development") {
      return "http://localhost:3001";
   }

   // return "https://docsurf.ai";
   return "https://docsurf.vercel.app";
}

export function getWebsiteUrl() {
   if (process.env.VITE_VERCEL_ENV === "production" || process.env.VITE_NODE_ENV === "production") {
      // return "https://docsurf.ai";
      return "https://docsurf.vercel.app";
   }

   if (process.env.VITE_VERCEL_ENV === "preview") {
      return `https://${process.env.VITE_VERCEL_URL}`;
   }

   return "http://localhost:3001";
}

export function getCdnUrl() {
   return "https://cdn.docsurf.ai";
}
