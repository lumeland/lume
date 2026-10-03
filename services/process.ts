/** Return the script arguments */
export function args(): string[] {
  return Deno.args;
}

/** Exit the process */
export function exit(code = 0): void {
  Deno.exit(code);
}

/** Get the resident set size (RSS) memory */
export function rss(): number {
  return Deno.memoryUsage().rss;
}

/** Returns the cwd path */
export function cwd() {
  return Deno.cwd();
}
