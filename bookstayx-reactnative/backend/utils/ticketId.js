const CODE_SPACE = 26 * 26 * 100000;

// Salt zero is mirrored in src/utils/ticket-id.ts so an API process that has
// not restarted yet still produces the same visible code on both screens.
function ticketIdCandidate(bookingId, salt = 0) {
  const input = salt === 0 ? String(bookingId) : `${bookingId}:${salt}`;
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash = Math.imul(hash ^ input.charCodeAt(index), 16777619);
  }
  const value = (hash >>> 0) % CODE_SPACE;
  const letterIndex = Math.floor(value / 100000);
  return String.fromCharCode(65 + Math.floor(letterIndex / 26), 65 + (letterIndex % 26)) +
    String(value % 100000).padStart(5, '0');
}

// The unique database index, not the hash, guarantees one code per booking.
// Call inside a transaction; savepoints let a collision retry without losing
// the surrounding booking transaction.
async function assignTicketId(client, dbId, bookingId) {
  for (let salt = 0; salt < CODE_SPACE; salt += 1) {
    const candidate = ticketIdCandidate(bookingId, salt);
    await client.query('SAVEPOINT ticket_id_attempt');
    try {
      const updated = await client.query(
        'UPDATE bookings SET ticket_id = $1 WHERE id = $2 AND ticket_id IS NULL RETURNING ticket_id',
        [candidate, dbId],
      );
      if (updated.rows.length) {
        await client.query('RELEASE SAVEPOINT ticket_id_attempt');
        return candidate;
      }

      const existing = await client.query('SELECT ticket_id FROM bookings WHERE id = $1', [dbId]);
      if (existing.rows[0]?.ticket_id) {
        await client.query('RELEASE SAVEPOINT ticket_id_attempt');
        return existing.rows[0].ticket_id;
      }
      throw new Error(`Booking ${dbId} was not found while assigning its ticket ID`);
    } catch (error) {
      await client.query('ROLLBACK TO SAVEPOINT ticket_id_attempt');
      await client.query('RELEASE SAVEPOINT ticket_id_attempt');
      if (error.code !== '23505') throw error;
    }
  }
  throw new Error('The seven-character ticket ID space is exhausted');
}

module.exports = { ticketIdCandidate, assignTicketId };
