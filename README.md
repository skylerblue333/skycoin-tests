# Sky HTTP Contract Assertions

Sky HTTP Contract Assertions is a small dependency-free TypeScript library for validating **captured HTTP response snapshots** against explicit status, header, and JSON-key contracts.

## Status

**Engineering beta.** This library does not make network requests or run browser/end-to-end suites. It validates response data supplied by a caller, making it useful as a reusable contract boundary inside integration tests and CI adapters.

The historical repository contained copied AI/security scaffolding and scripts that printed `Tests passing` without running tests. Those unrelated and unsupported surfaces are removed from the active product branch.

## Supported assertions

- one or more allowed HTTP status codes;
- required response headers using case-insensitive header names;
- required top-level JSON object keys;
- deterministic structured failure reports;
- bounded contract rule counts and name/key lengths;
- strict HTTP status validation.

## Example

```ts
import { validateResponseContract } from './src';

const report = validateResponseContract(
  {
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: { status: 'ok' },
  },
  {
    allowedStatuses: [200],
    requiredHeaders: ['content-type'],
    requiredJsonKeys: ['status'],
  },
);
```

`report.ok` is `false` when a response violates the supplied contract; mismatches are returned as structured failures rather than being hidden behind placeholder success output.

## Verify

```bash
npm install
npm run build
npm test
npm audit --omit=dev --audit-level=high
```

## Boundaries

This package does not perform HTTP requests, retries, authentication, TLS validation, browser automation, load testing, fuzzing, schema generation, OpenAPI conformance, persistence, test orchestration, or production monitoring. A caller is responsible for capturing the response snapshot through an appropriate test/runtime client.

## SKYCOIN4444 integration

Gateway, health, API, and service products can reuse this library to assert stable response contracts in their own test suites without coupling those tests to a specific HTTP client.

## License

See `LICENSE`.
