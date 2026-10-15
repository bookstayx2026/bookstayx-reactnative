const assert = require('node:assert/strict');
const test = require('node:test');
const { normalizeDatabaseUrl } = require('../src/config/database');

test('normalizeDatabaseUrl strips surrounding quotes and whitespace', () => {
  const base = 'postgresql://postgres.fpufyiltalgtxbwvjjmo:mypassword@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';
  assert.equal(normalizeDatabaseUrl(`"${base}"`), base);
  assert.equal(normalizeDatabaseUrl(`'${base}'`), base);
  assert.equal(normalizeDatabaseUrl(`\`${base}\``), base);
  assert.equal(normalizeDatabaseUrl(`  ${base}  `), base);
  assert.equal(normalizeDatabaseUrl(`\n"${base}"\n`), base);
});

test('normalizeDatabaseUrl preserves exact password without destructive rewrites', () => {
  const complex = 'postgresql://postgres.fpufyiltalgtxbwvjjmo:P%40ss%25Word!123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
  assert.equal(normalizeDatabaseUrl(complex), complex);
});

test('normalizeDatabaseUrl safely handles null, undefined, or empty values', () => {
  assert.equal(normalizeDatabaseUrl(null), null);
  assert.equal(normalizeDatabaseUrl(undefined), undefined);
  assert.equal(normalizeDatabaseUrl(''), '');
});
