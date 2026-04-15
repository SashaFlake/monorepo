import { z } from 'zod';
import { err, ok } from 'neverthrow';
import type { Result } from '../result.js';
import { domainError } from '../error/domain-error.js';

// ---------------------------------------------------------------------------
// Generic VO factory
// ---------------------------------------------------------------------------
type Brand<T, B extends string> = T & { readonly _brand: B };

// ---------------------------------------------------------------------------
// DeviceSerialNumber
// ---------------------------------------------------------------------------
export type DeviceSerialNumber = Brand<string, 'DeviceSerialNumber'>;
export const DeviceSerialNumber = {
  create(value: string): Result<DeviceSerialNumber, ReturnType<typeof domainError>> {
    const v = value.trim().toUpperCase();
    if (v.length < 4 || v.length > 64)
      return err(domainError('INVALID_SERIAL_NUMBER', 'Serial number must be 4–64 characters', { value }));
    return ok(v as DeviceSerialNumber);
  },
};

// ---------------------------------------------------------------------------
// UDID (Apple / Android)
// ---------------------------------------------------------------------------
export type Udid = Brand<string, 'Udid'>;
export const Udid = {
  schema: z.string().min(8).max(100),
  create(value: string): Result<Udid, ReturnType<typeof domainError>> {
    const result = Udid.schema.safeParse(value.trim());
    if (!result.success)
      return err(domainError('INVALID_UDID', 'UDID must be 8–100 characters', { value }));
    return ok(result.data as Udid);
  },
};

// ---------------------------------------------------------------------------
// Platform
// ---------------------------------------------------------------------------
export const PLATFORMS = ['ios', 'macos', 'android', 'windows', 'linux'] as const;
export type Platform = (typeof PLATFORMS)[number];

// ---------------------------------------------------------------------------
// PolicyRule — arbitrary JSON payload validated by Zod
// ---------------------------------------------------------------------------
export type PolicyRulePayload = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Fingerprint (certificate SHA-256)
// ---------------------------------------------------------------------------
export type CertificateFingerprint = Brand<string, 'CertificateFingerprint'>;
export const CertificateFingerprint = {
  create(hex: string): Result<CertificateFingerprint, ReturnType<typeof domainError>> {
    if (!/^[a-fA-F0-9]{64}$/.test(hex))
      return err(domainError('INVALID_FINGERPRINT', 'Fingerprint must be a 64-char hex SHA-256', { hex }));
    return ok(hex.toLowerCase() as CertificateFingerprint);
  },
};

// ---------------------------------------------------------------------------
// TokenValue (opaque, at least 32 chars)
// ---------------------------------------------------------------------------
export type TokenValue = Brand<string, 'TokenValue'>;
export const TokenValue = {
  create(value: string): Result<TokenValue, ReturnType<typeof domainError>> {
    if (value.length < 32)
      return err(domainError('INVALID_TOKEN_VALUE', 'Token must be at least 32 characters', { length: value.length }));
    return ok(value as TokenValue);
  },
};
