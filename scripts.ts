import { brightGreen, gray } from "./deps/colors.ts";
import Site from "./site.ts";
import { Command, CommandOptions, Scripts as iScripts } from "./types.ts";

/**
 * This class manages and execute all user scripts
 */
export default class Scripts implements iScripts {
  site: Site;
  scripts: Map<string, Command[]> = new Map();

  constructor(site: Site) {
    this.site = site;
  }

  /**
   * Register a new script
   */
  set(name: string, ...commands: Command[]) {
    this.scripts.set(name, commands);
  }

  /**
   * Run one or more scripts
   */
  async run(options: CommandOptions, ...names: Command[]) {
    options = { cwd: this.site.options.cwd, ...options };

    for (const name of names) {
      const success = await this.#runScript(options, name);

      if (!success) {
        return false;
      }
    }

    return true;
  }

  /**
   * Run an individual script or command
   */
  async #runScript(options: CommandOptions, name: Command): Promise<unknown> {
    if (typeof name === "string" && this.scripts.has(name)) {
      if (!this.site.options.quiet) {
        console.log(`⚡️ ${brightGreen(name)}`);
      }
      const command = this.scripts.get(name)!;
      return this.run(options, ...command);
    }

    if (Array.isArray(name)) {
      const results = await Promise.all(
        name.map((n) => this.#runScript(options, n)),
      );
      return results.every((success) => success);
    }

    if (typeof name === "function") {
      return this.#runFunction(name);
    }

    return this.#runCommand(options, name);
  }

  /**
   * Run a function
   */
  async #runFunction(fn: (site: Site) => unknown) {
    if (fn.name && !this.site.options.quiet) {
      console.log(gray(`⚡️ ${fn.name}()`));
    }
    const result = await fn(this.site);
    return result !== false;
  }

  /**
   * Run a shell command
   */
  async #runCommand(options: CommandOptions, command: string) {
    if (!this.site.options.quiet) {
      console.log(gray(`⚡️ ${command}`));
    }

    const cmd = shArgs(command);
    const process = Deno.run({ cmd, ...options });
    const status = await process.status();
    process.close();

    return status.success;
  }
}

/**
 * Returns the shell arguments for the current platform
 */
function shArgs(command: string) {
  return Deno.build.os === "windows"
    ? ["PowerShell.exe", "-Command", command]
    : ["/bin/bash", "-c", command];
}
