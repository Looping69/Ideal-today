export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function asIsoDate(value: unknown) {
  if (!isNonEmptyString(value)) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
