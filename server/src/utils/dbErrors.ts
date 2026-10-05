const CONNECTION_ERROR_CODES = new Set(["ETIMEDOUT", "ENETUNREACH", "ECONNREFUSED", "EHOSTUNREACH"]);

export const isDatabaseUnavailable = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const aggregate = error as { code?: string; errors?: unknown[] };
  if (aggregate.code && CONNECTION_ERROR_CODES.has(aggregate.code)) return true;
  return aggregate.errors?.some(item => isDatabaseUnavailable(item)) ?? false;
};
