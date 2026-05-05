/**
 * Utility functions for formatting display values
 */

/**
 * Format cooking time in minutes to a human-readable string.
 * Examples:
 * - 30 -> "30 min"
 * - 60 -> "1 hr"
 * - 90 -> "1 hr 30 min"
 * - 150 -> "2 hr 30 min"
 */
export function formatCookingTime(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) {
    return "";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr${hours > 1 ? "" : ""}`;
  }

  return `${hours} hr${hours > 1 ? "" : ""} ${remainingMinutes} min`;
}
