import type { Logger } from "../core.ts";

export interface Options {
  /** The logger to use */
  logger: Logger;

  /** The default cwd for scripts */
  options: ScriptOptions;
}

/**
 * Script runner to store and run commands or execute functions
 * It can execute the scripts and functions in parallel or sequentially
 */
export default class Scripts {
  /** The logger to output messages in the terminal */
  logger: Logger;

  /** The default options to execute the scripts */
  options: ScriptOptions;

  /** All registered scripts and functions */
  scripts = new Map<string, ScriptOrFunction[]>();

  constructor(options: Options) {
    this.logger = options.logger;
    this.options = options.options;
  }

  /** Register one or more scripts under a specific name */
  set(name: string, ...scripts: ScriptOrFunction[]): void {
    this.scripts.set(name, scripts);
  }

  /** Run one or more commands */
  async run(
    options: ScriptOptions,
    ...names: ScriptOrFunction[]
  ): Promise<boolean> {
    options = { ...this.options, ...options };

    for (const name of names) {
      const success = await this.#run(options, name);

      if (!success) {
        return false;
      }
    }

    return true;
  }

  /** Run an individual script or function */
  async #run(options: ScriptOptions, name: ScriptOrFunction): Promise<unknown> {
    if (typeof name === "string" && this.scripts.has(name)) {
      this.logger.log(`⚡️ <green>${name}</green>`);
      const command = this.scripts.get(name)!;
      return this.run(options, ...command);
    }

    if (Array.isArray(name)) {
      const results = await Promise.all(
        name.map((n) => this.#run(options, n)),
      );
      return results.every((success) => success);
    }

    if (typeof name === "function") {
      return this.#runFunction(name);
    }

    return this.#runScript(options, name);
  }

  /** Run a function */
  async #runFunction(fn: () => unknown) {
    this.logger.log(`⚡️ <dim>${fn.name}()</dim>`);
    const result = await fn();
    return result !== false;
  }

  /** Run a shell command */
  async #runScript(options: ScriptOptions, script: string) {
    this.logger.log(`⚡️ <dim>${script}</dim>`);

    const cmd = shArgs(script);
    const process = Deno.run({ cmd, ...options });
    const status = await process.status();
    process.close();

    return status.success;
  }
}

/** Returns the shell arguments for the current platform */
function shArgs(script: string) {
  return Deno.build.os === "windows"
    ? ["PowerShell.exe", "-Command", script]
    : ["/bin/bash", "-c", script];
}

/** A script or function */
export type ScriptOrFunction = string | (() => unknown) | ScriptOrFunction[];

/** The options for a script */
export type ScriptOptions = Omit<Deno.RunOptions, "cmd">;
