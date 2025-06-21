/**
 * Gets the first two initials from a name
 * @param name - The full name to extract initials from
 * @returns The first two initials in uppercase
 */
export function getInitials(name: string): string {
   if (!name) return "";

   // Split the name by spaces and filter out empty strings
   const nameParts = name.split(" ").filter((part) => part.length > 0);

   if (nameParts.length === 0) return "";
   if (nameParts.length === 1) return (nameParts[0]?.charAt(0) || "").toUpperCase();

   // Get the first letter of the first and last parts
   const firstLetter = nameParts[0]?.charAt(0) || "";
   const lastLetter = nameParts[nameParts.length - 1]?.charAt(0) || "";

   return (firstLetter + lastLetter).toUpperCase();
}
