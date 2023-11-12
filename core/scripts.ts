import { log } from "./utils/log.ts";

export interface Options {
  /** The current working directory */
  cwd?: string;
}

/**
 * Script runner to store and run commands or execute functions
 * It can execute the scripts and functions in parallel or sequentially
 */
export default class Scripts {
  /** The current working directory */
  cwd: string;

  /** All registered scripts and functions */
  scripts = new Map<string, ScriptOrFunction[]>();

  constructor(options: Options = {}) {
    this.cwd = options.cwd || Deno.cwd();
  }

  /** Register one or more scripts under a specific name */
  set(name: string, ...scripts: ScriptOrFunction[]): void {
    this.scripts.set(name, scripts);
  }

  /** Run one or more commands */
  async run(
    ...names: ScriptOrFunction[]
  ): Promise<boolean> {
    for (const name of names) {
      const success = await this.#run(name);

      if (!success) {
        return false;
      }
    }

    return true;
  }

  /** Run an individual script or function */
  async #run(name: ScriptOrFunction): Promise<unknown> {
    if (typeof name === "string" && this.scripts.has(name)) {
      log.info(`[script] ${name}`);
      const command = this.scripts.get(name)!;
      return this.run(...command);
    }

    if (Array.isArray(name)) {
      const results = await Promise.all(
        name.map((n) => this.#run(n)),
      );
      return results.every((success) => success);
    }

    if (typeof name === "function") {
      return this.#runFunction(name);
    }

    return this.#runScript(name);
  }

  /** Run a function */
  async #runFunction(fn: () => unknown) {
    if (fn.name) {
      log.info(`[script] ${fn.name}()`);
    }
    const result = await fn();
    return result !== false;
  }

  /** Run a shell command */
  async #runScript(script: string) {
    log.info(`[script] ${script}`);

    const args = shArgs(script);
    const cmd = args.shift()!;

    const command = new Deno.Command(cmd, {
      args,
      stdout: "inherit",
      stderr: "inherit",
      cwd: this.cwd,
    });

    const output = await command.output();
    return output.success;
  }
}

/** Returns the shell arguments for the current platform */
function shArgs(script: string) {
  return Deno.build.os === "windows"
    ? ["PowerShell.exe", "-Command", script]
    : ["/usr/bin/env", "bash", "-c", script];
}

/** A script or function */
export type ScriptOrFunction = string | (() => unknown) | ScriptOrFunction[];
