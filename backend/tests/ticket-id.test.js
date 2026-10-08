const assert = require('node:assert/strict');
const test = require('node:test');
const { assignTicketId, ticketIdCandidate } = require('../utils/ticketId');

test('ticket ID is always two uppercase letters followed by five digits', () => {
  const bookingId = 'PHC-MU3ENRD-B5F733';
  assert.equal(ticketIdCandidate(bookingId), 'OR25400');
  assert.match(ticketIdCandidate(bookingId), /^[A-Z]{2}[0-9]{5}$/);
  assert.match(ticketIdCandidate(bookingId, 1), /^[A-Z]{2}[0-9]{5}$/);
});

test('assignment retries a database uniqueness collision', async () => {
  const bookingId = 'PHC-MU3ENRD-B5F733';
  const attempted = [];
  const client = {
    async query(sql, params) {
      if (sql.startsWith('UPDATE bookings')) {
        attempted.push(params[0]);
        if (attempted.length === 1) throw Object.assign(new Error('duplicate'), { code: '23505' });
        return { rows: [{ ticket_id: params[0] }] };
      }
      return { rows: [] };
    },
  };

  const assigned = await assignTicketId(client, 42, bookingId);
  assert.deepEqual(attempted, [ticketIdCandidate(bookingId), ticketIdCandidate(bookingId, 1)]);
  assert.equal(assigned, attempted[1]);
});

test('assignment reuses an already stored ticket ID', async () => {
  const client = {
    async query(sql) {
      if (sql.startsWith('UPDATE bookings')) return { rows: [] };
      if (sql.startsWith('SELECT ticket_id')) return { rows: [{ ticket_id: 'AB12345' }] };
      return { rows: [] };
    },
  };
  assert.equal(await assignTicketId(client, 42, 'PHC-EXAMPLE-123456'), 'AB12345');
});
