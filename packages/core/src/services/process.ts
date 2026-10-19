import process from "node:process";
import util from "node:util";
import { spawn, spawnSync } from "node:child_process";

/** Return the script arguments */
export function args(): string[] {
  return process.argv.splice(2);
}

/** Exit the process */
export function exit(code = 0): void {
  process.exit(code);
}

/** Get the resident set size (RSS) memory */
export function rss(): number {
  return process.memoryUsage().rss;
}

/** Returns the cwd path */
export function cwd() {
  return process.cwd();
}

/** Returns the operating system */
export function os(): "windows" | "darwin" | "unix" {
  switch (process.platform) {
    case "win32":
      return "windows";
    case "darwin":
      return "darwin";
    default:
      return "unix";
  }
}

export function setEnv(name: string, value: string) {
  process.env[name] = value;
}

/** Get an environment variable */
export function env(name: string): string | undefined {
  return process.env[name];
}

/** Convert the value to a string */
export function inspect(value: unknown): string {
  return util.inspect(value, { colors: true });
}

/** Synchronously run a piped command and return [stdout, stderr] */
export function runPipedCommand(
  cmd: string,
  args: string[] = [],
  cwd?: string,
): [string | undefined, string | undefined] {
  const result = spawnSync(cmd, args, {
    cwd,
    shell: false,
    encoding: "utf-8",
  });

  if (result.error) {
    return [undefined, result.error.message.trim()];
  }

  if (result.status !== 0) {
    return [undefined, (result.stderr ?? "").trim()];
  }

  return [(result.stdout ?? "").trim(), undefined];
}

/** Run an command and return if it's success */
export async function runCommand(cmd: string, args: string[] = [], cwd?: string): Promise<boolean> {
  return await new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd,
      shell: false,
      stdio: "inherit",
    });

    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0));
  });
}
