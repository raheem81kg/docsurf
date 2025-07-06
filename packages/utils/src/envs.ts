// Note: NODE_ENV is not available automatically in Convex

export function getConvexAppUrl() {
   // Only use the frontend URL if it's available
   if (process.env.FRONTEND_URL) {
      return process.env.FRONTEND_URL;
   }

   // Fallback to localhost if no frontend URL is available
   return "http://localhost:3001";
}

export function getConvexAppUrls(): string[] {
   const urls: string[] = [];

   if (process.env.FRONTEND_URL) {
      urls.push(process.env.FRONTEND_URL);
   }

   if (process.env.FRONTEND_PREVIEW_URL) {
      urls.push(process.env.FRONTEND_PREVIEW_URL);
   }

   // Only include localhost if no frontend URLs are available
   if (urls.length === 0) {
      urls.push("http://localhost:3001");
   }

   return urls;
}

export function getAppUrl() {
   if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
      return "https://docsurf.ai";
   }

   if (process.env.VERCEL_ENV === "preview") {
      return `https://${process.env.VERCEL_URL}`;
   }

   return "http://localhost:3001";
}

export function getEmailUrl() {
   // if (process.env.NODE_ENV === "development") {
   //    return "http://localhost:3001";
   // }

   return "https://docsurf.ai";
}
// This is used if you have a different website url than the app url
// export function getWebsiteUrl() {
//    if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "production") {
//       return "https://docsurf.vercel.app";
//    }

//    if (process.env.NODE_ENV === "preview") {
//       return `https://${process.env.FRONTEND_PREVIEW_URL}`;
//    }

//    return "http://localhost:3001";
// }

export function getCdnUrl() {
   return "https://cdn.docsurf.ai";
}
