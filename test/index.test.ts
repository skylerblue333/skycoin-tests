import assert from 'node:assert/strict';
import test from 'node:test';

import { validateResponseContract } from '../src/index';

test('accepts matching status headers and JSON keys case-insensitively for headers', () => {
  const report = validateResponseContract(
    { status: 200, headers: { 'Content-Type': 'application/json' }, body: { status: 'ok', version: 1 } },
    { allowedStatuses: [200], requiredHeaders: ['content-type'], requiredJsonKeys: ['status', 'version'] },
  );
  assert.deepEqual(report, { ok: true, failures: [] });
});

test('reports deterministic failures instead of throwing for contract mismatches', () => {
  const report = validateResponseContract(
    { status: 503, headers: {}, body: { status: 'down' } },
    { allowedStatuses: [200], requiredHeaders: ['x-request-id'], requiredJsonKeys: ['version'] },
  );
  assert.equal(report.ok, false);
  assert.deepEqual(report.failures.map((failure) => failure.code), ['status', 'header', 'json_key']);
});

test('reports body type when required JSON keys target a non-object body', () => {
  const report = validateResponseContract(
    { status: 200, body: ['not', 'an', 'object'] },
    { allowedStatuses: [200], requiredJsonKeys: ['status'] },
  );
  assert.deepEqual(report.failures.map((failure) => failure.code), ['body_type']);
});

test('rejects malformed status and rule definitions', () => {
  assert.throws(() => validateResponseContract({ status: 99 }, { allowedStatuses: [200] }), /snapshot status/);
  assert.throws(() => validateResponseContract({ status: 200 }, { allowedStatuses: [] }), /allowedStatuses/);
  assert.throws(() => validateResponseContract({ status: 200 }, { allowedStatuses: [true as unknown as number] }), /status codes/);
  assert.throws(
    () => validateResponseContract({ status: 200 }, { allowedStatuses: [200], requiredHeaders: ['   '] }),
    /header names/,
  );
});
