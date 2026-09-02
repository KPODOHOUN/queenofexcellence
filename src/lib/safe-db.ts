import { isDatabaseConfigured } from "@/lib/prisma";

export async function safeQuery<T>(
  label: string,
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  if (!isDatabaseConfigured()) return fallback;
  try {
    return await fn();
  } catch (error) {
    console.error(`[safeQuery:${label}]`, error);
    return fallback;
  }
}
