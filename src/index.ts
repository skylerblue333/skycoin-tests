export interface ResponseSnapshot {
  status: number;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface ContractSpec {
  allowedStatuses: readonly number[];
  requiredHeaders?: readonly string[];
  requiredJsonKeys?: readonly string[];
}

export interface ContractFailure {
  code: 'status' | 'header' | 'body_type' | 'json_key';
  message: string;
}

export interface ContractReport {
  ok: boolean;
  failures: ContractFailure[];
}

const MAX_RULES = 100;
const MAX_HEADER_NAME = 128;
const MAX_JSON_KEY = 256;

function normalizeHeaders(headers: Record<string, string> = {}): Record<string, string> {
  return Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
}

function validateSpec(spec: ContractSpec): void {
  if (spec.allowedStatuses.length < 1 || spec.allowedStatuses.length > MAX_RULES) {
    throw new TypeError(`allowedStatuses must contain 1-${MAX_RULES} entries`);
  }
  for (const status of spec.allowedStatuses) {
    if (!Number.isSafeInteger(status) || status < 100 || status > 599) {
      throw new TypeError('allowed status codes must be integers between 100 and 599');
    }
  }
  if ((spec.requiredHeaders?.length ?? 0) > MAX_RULES || (spec.requiredJsonKeys?.length ?? 0) > MAX_RULES) {
    throw new TypeError(`contract rule groups cannot exceed ${MAX_RULES} entries`);
  }
  for (const header of spec.requiredHeaders ?? []) {
    if (!header.trim() || header.length > MAX_HEADER_NAME) throw new TypeError('required header names must be 1-128 characters');
  }
  for (const key of spec.requiredJsonKeys ?? []) {
    if (!key.trim() || key.length > MAX_JSON_KEY) throw new TypeError('required JSON keys must be 1-256 characters');
  }
}

function hasOwn(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

/** Validate a captured response without making any network request. */
export function validateResponseContract(snapshot: ResponseSnapshot, spec: ContractSpec): ContractReport {
  validateSpec(spec);
  if (!Number.isSafeInteger(snapshot.status) || snapshot.status < 100 || snapshot.status > 599) {
    throw new TypeError('snapshot status must be an integer between 100 and 599');
  }

  const failures: ContractFailure[] = [];
  if (!spec.allowedStatuses.includes(snapshot.status)) {
    failures.push({ code: 'status', message: `status ${snapshot.status} is not allowed` });
  }

  const headers = normalizeHeaders(snapshot.headers);
  for (const required of spec.requiredHeaders ?? []) {
    const normalized = required.trim().toLowerCase();
    if (!hasOwn(headers, normalized)) {
      failures.push({ code: 'header', message: `missing required header: ${normalized}` });
    }
  }

  const requiredKeys = spec.requiredJsonKeys ?? [];
  if (requiredKeys.length > 0) {
    if (snapshot.body === null || typeof snapshot.body !== 'object' || Array.isArray(snapshot.body)) {
      failures.push({ code: 'body_type', message: 'response body must be a JSON object' });
    } else {
      for (const key of requiredKeys) {
        if (!hasOwn(snapshot.body, key)) {
          failures.push({ code: 'json_key', message: `missing required JSON key: ${key}` });
        }
      }
    }
  }

  return { ok: failures.length === 0, failures };
}

export const LIMITS = { MAX_RULES, MAX_HEADER_NAME, MAX_JSON_KEY } as const;
