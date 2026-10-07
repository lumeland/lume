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

/** Returns the operating system */
export function os(): "windows" | "darwin" | "unix" {
  switch (Deno.build.os) {
    case "windows":
    case "darwin":
      return Deno.build.os;
    default:
      return "unix";
  }
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

/** Convert the value to a string */
export function inspect(value: unknown): string {
  return Deno.inspect(value, { colors: true });
}

const decoder = new TextDecoder();

/** Synchronously run a piped command and return [stdout, stderr] */
export function runPipedCommand(
  cmd: string,
  args?: string[],
  cwd?: string,
): [string | undefined, string | undefined] {
  const { stdout, stderr, success } = new Deno.Command(cmd, {
    args,
    stdout: "piped",
    stderr: "piped",
    cwd,
  }).outputSync();

  if (!success) {
    return [undefined, decoder.decode(stderr).trim()];
  }

  return [decoder.decode(stdout).trim(), undefined];
}

/** Run an command and return if it's success */
export async function runCommand(
  cmd: string,
  args?: string[],
  cwd?: string,
): Promise<boolean> {
  const { success } = await new Deno.Command(cmd, {
    args,
    stdout: "inherit",
    stderr: "inherit",
    cwd,
  }).output();

  return success;
}
