export type SchemaResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type Schema<T> = {
  name: string;
  parse(value: unknown): SchemaResult<T>;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function numberValue(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function requireRecord(value: unknown, name: string): SchemaResult<Record<string, unknown>> {
  if (!isRecord(value)) return { success: false, error: `${name} must be an object` };
  return { success: true, data: value };
}
