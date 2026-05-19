export function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function keepExistingIfInvalid<T>(
  incoming: T | null | undefined,
  existing: T
): T {
  if (incoming === null || incoming === undefined) return existing;

  if (typeof incoming === "string" && incoming.trim() === "") {
    return existing;
  }

  if (typeof incoming === "number" && !Number.isFinite(incoming)) {
    return existing;
  }

  return incoming;
}
