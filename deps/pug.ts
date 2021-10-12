export * from "https://cdn.jsdelivr.net/gh/lumeland/pug@v0.1.1/mod.js";

export interface PugOptions {
  filters?: Record<string, (...arg: unknown[]) => unknown>;
  [key: string]: unknown;
}
