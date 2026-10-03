/** Return the script arguments */
export function args(): string[] {
  return Deno.args;
}

/** Exit the process */
export function exit(code = 0): void {
  Deno.exit(code);
}
