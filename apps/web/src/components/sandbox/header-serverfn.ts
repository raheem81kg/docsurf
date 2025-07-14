// Server function for Header: calls the /api/header-demo endpoint and returns the result
// Used for demo/test button in Header

export async function fetchHeaderDemo() {
   const res = await fetch("/api/header-demo", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
   });
   if (!res.ok) {
      throw new Error("Failed to fetch header demo data");
   }
   return res.json();
}
