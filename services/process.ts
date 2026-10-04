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

/** Set an environment variable */
const envVars = new Map<string, string>();

export function setEnv(name: string, value: string) {
  if (allowedEnvVars()) {
    Deno.env.set(name, value);
  }
  envVars.set(name, value);
}

/** Get an environment variable */
export function env(name: string): string | undefined {
  return allowedEnvVars()
    ? envVars.get(name) ?? Deno.env.get(name)
    : envVars.get(name);
}

let allowed: boolean | undefined;
function allowedEnvVars(): boolean {
  if (allowed === undefined) {
    allowed = Deno.permissions.querySync?.({ name: "env" }).state === "granted";
  }
  return allowed;
}
