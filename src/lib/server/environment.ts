import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

export function readServerEnvironment(key: string): string | undefined {
  try {
    const value = (getCloudflareContext().env as unknown as Record<string, unknown>)[
      key
    ];
    if (typeof value === "string") return value;
  } catch {
    // Standard Node and standalone builds do not provide a Cloudflare context.
  }

  const value = process.env[key];
  return typeof value === "string" ? value : undefined;
}

export function serverEnvironmentEnabled(key: string): boolean {
  return readServerEnvironment(key) === "true";
}
