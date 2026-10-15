const assert = require('node:assert/strict');
const test = require('node:test');
const { normalizeDatabaseUrl } = require('../src/config/database');

test('normalizeDatabaseUrl strips surrounding quotes', () => {
  const base = 'postgresql://postgres.fpufyiltalgtxbwvjjmo:mypassword@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';
  assert.equal(normalizeDatabaseUrl(`"${base}"`), base);
  assert.equal(normalizeDatabaseUrl(`'${base}'`), base);
  assert.equal(normalizeDatabaseUrl(`\`${base}\``), base);
  assert.equal(normalizeDatabaseUrl(`  ${base}  `), base);
});

test('normalizeDatabaseUrl removes literal brackets around password', () => {
  const bracketed = 'postgresql://postgres.fpufyiltalgtxbwvjjmo:[mypassword123]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';
  const expected = 'postgresql://postgres.fpufyiltalgtxbwvjjmo:mypassword123@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';
  assert.equal(normalizeDatabaseUrl(bracketed), expected);
});

test('normalizeDatabaseUrl fixes double-encoded percent signs in password', () => {
  const doubleEncoded = 'postgresql://postgres.fpufyiltalgtxbwvjjmo:Pass%2540123@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';
  const expected = 'postgresql://postgres.fpufyiltalgtxbwvjjmo:Pass%40123@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';
  assert.equal(normalizeDatabaseUrl(doubleEncoded), expected);
});

test('normalizeDatabaseUrl auto-appends project ref when user is bare postgres on pooler host', () => {
  const missingRef = 'postgresql://postgres:mypassword@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';
  const expected = 'postgresql://postgres.fpufyiltalgtxbwvjjmo:mypassword@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';
  assert.equal(normalizeDatabaseUrl(missingRef), expected);
});

test('normalizeDatabaseUrl preserves properly formatted connection strings', () => {
  const valid = 'postgresql://postgres.fpufyiltalgtxbwvjjmo:mypassword@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
  assert.equal(normalizeDatabaseUrl(valid), valid);
});

test('normalizeDatabaseUrl safely handles null, undefined, or empty values', () => {
  assert.equal(normalizeDatabaseUrl(null), null);
  assert.equal(normalizeDatabaseUrl(undefined), undefined);
  assert.equal(normalizeDatabaseUrl(''), '');
});
