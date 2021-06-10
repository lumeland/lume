import { brightGreen, gray } from "./deps/colors.js";

export default class Scripts {
  scripts = new Map();

  constructor(site) {
    this.site = site;
  }

  set(name, ...commands) {
    this.scripts.set(name, commands);
  }

  async run(options = {}, ...names) {
    options = { cwd: this.site.options.cwd, ...options };

    for (const name of names) {
      const success = await this.#runScript(options, name);

      if (!success) {
        return false;
      }
    }

    return true;
  }

  async #runScript(options, name) {
    if (this.scripts.has(name)) {
      console.log(`⚡️ ${brightGreen(name)}`);
      name = this.scripts.get(name);
      return this.run(options, ...name);
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

  async #runFunction(fn) {
    if (fn.name) {
      console.log(gray(`⚡️ ${fn.name}()`));
    }
    const result = await fn(this.site);
    return result !== false;
  }

  async #runCommand(options, command) {
    console.log(gray(`⚡️ ${command}`));

    const cmd = shArgs(command);
    const process = Deno.run({ cmd, ...options });
    const status = await process.status();
    process.close();

    return status.success;
  }
}

function shArgs(command) {
  return Deno.build.os === "windows"
    ? ["PowerShell.exe", "-Command", command]
    : ["/bin/bash", "-c", command];
}
