const TICKET_ID_PATTERN = /^[A-Z]{2}[0-9]{5}$/;
const CODE_SPACE = 26 * 26 * 100_000;

/**
 * An older, still-running API may not send ticket_id yet. Keep the ticket
 * visible and matchable in the owner UI until that API process is restarted.
 */
export function ticketIdForDisplay(ticketId: string | null | undefined, bookingId: string): string {
  if (ticketId && TICKET_ID_PATTERN.test(ticketId)) return ticketId;

  let hash = 2166136261;
  for (let index = 0; index < bookingId.length; index += 1) {
    hash = Math.imul(hash ^ bookingId.charCodeAt(index), 16777619);
  }
  const value = (hash >>> 0) % CODE_SPACE;
  const letterIndex = Math.floor(value / 100_000);
  return String.fromCharCode(65 + Math.floor(letterIndex / 26), 65 + (letterIndex % 26)) +
    String(value % 100_000).padStart(5, "0");
}
