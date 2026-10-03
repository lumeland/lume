import { env } from "./env.ts";
import Logger from "../logger.ts";
import type { LevelName } from "../logger.ts";

// Get the log level from the environment variable LUME_LOGS
const level = env("LUME_LOGS")?.toUpperCase() as
  | LevelName
  | undefined ?? "INFO";

export const log = new Logger(level);

const withValue = new Set<string>();
/**
 * Log a message only while the condition is false.
 * This is useful to avoid logging an error message in a update
 * where the number of pages to process are less than a complete build.
 */
export function warnUntil(message: string, condition: unknown): boolean {
  if (withValue.has(message)) {
    return !!condition;
  }
  if (condition) {
    withValue.add(message);
    return true;
  }
  log.warn(message);
  return false;
}
