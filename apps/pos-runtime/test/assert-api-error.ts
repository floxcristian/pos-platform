import { expect } from 'vitest';

export function expectApiError(
  response: { statusCode: number; json(): unknown },
  statusCode: number,
  expected: { code: string; category: string; message: string },
): void {
  expect(response.statusCode).toBe(statusCode);
  const body = response.json();
  if (
    typeof body !== 'object' ||
    body === null ||
    !('timestamp' in body) ||
    typeof body.timestamp !== 'string'
  ) {
    throw new Error('The API error must include a string timestamp.');
  }
  const timestamp = body.timestamp;
  expect(body).toEqual({ ...expected, timestamp });
  expect(new Date(timestamp).toISOString()).toBe(timestamp);
}
