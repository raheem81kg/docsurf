/**
 * Gets initials from a name, using the first character of the first and last parts.
 * e.g., "John Fitzgerald Doe" becomes "JD". A single name like "John" becomes "J".
 *
 * @param name The full name to extract initials from. Can be null or contain extra spacing.
 * @returns The resulting initials in uppercase. Returns an empty string if the name is empty.
 */
export function getInitials(name: string): string {
   if (!name?.trim()) {
      return "";
   }

   const parts = name.trim().split(/\s+/);
   const firstInitial = parts[0]?.[0] ?? "";
   const lastInitial = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";

   return `${firstInitial}${lastInitial}`.toUpperCase();
}
