import { Request } from 'express';

/**
 * Safely extract a single string route parameter.
 * Express 5 types `req.params[key]` as `string | string[]`.
 * This helper normalizes it to a single string.
 */
export function paramId(req: Request, name: string): string {
  const val = req.params[name];
  return Array.isArray(val) ? val[0] : val;
}

/**
 * Safely extract a single string query parameter.
 * Express 5 types `req.query[key]` as `string | string[] | undefined`.
 */
export function queryStr(req: Request, name: string): string | undefined {
  const val = req.query[name];
  if (val === undefined) return undefined;
  if (Array.isArray(val)) return val[0] as string;
  if (typeof val === 'string') return val;
  return String(val);
}
