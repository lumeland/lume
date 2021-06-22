import { brightGreen, gray } from "./deps/colors.ts";
import Site from "./site.ts";
import type { Command } from "./types.ts";

export default class Scripts {
  site: Site;
  scripts: Map<string, Command[]> = new Map();

  constructor(site: Site) {
    this.site = site;
  }

  set(name: string, ...commands: Command[]) {
    this.scripts.set(name, commands);
  }

  async run(options: Deno.RunOptions, ...names: Command[]): Promise<boolean> {
    options = { cwd: this.site.options.cwd, ...options };

    for (const name of names) {
      const success = await this.#runScript(options, name);

      if (!success) {
        return false;
      }
    }

    return true;
  }

  async #runScript(options: Deno.RunOptions, name: Command): Promise<unknown> {
    if (typeof name === "string" && this.scripts.has(name)) {
      if (this.site.options.verbose > 0) {
        console.log(`⚡️ ${brightGreen(name)}`);
      }

      const command = this.scripts.get(name);

      if (command) {
        return this.run(options, ...command);
      }
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

  async #runFunction(fn: (site: Site) => unknown): Promise<boolean> {
    if (fn.name && this.site.options.verbose > 0) {
      console.log(gray(`⚡️ ${fn.name}()`));
    }
    const result = await fn(this.site);
    return result !== false;
  }

  async #runCommand(
    options: Deno.RunOptions,
    command: string,
  ): Promise<boolean> {
    if (this.site.options.verbose > 0) {
      console.log(gray(`⚡️ ${command}`));
    }

    const cmd = shArgs(command);
    const process = Deno.run({ ...options, cmd });
    const status = await process.status();
    process.close();

    return status.success;
  }
}

function shArgs(command: string): string[] {
  return Deno.build.os === "windows"
    ? ["PowerShell.exe", "-Command", command]
    : ["/bin/bash", "-c", command];
}
