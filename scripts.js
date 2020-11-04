import { brightGreen } from "./deps/colors.js";

export default class Scripts {
  scripts = new Map();

  constructor(site) {
    this.site = site;
  }

  set(name, ...scripts) {
    this.scripts.set(name, scripts);
  }

  async run(...names) {
    for (const name of names) {
      const success = await this.#runScript(name);

      if (!success) {
        return false;
      }
    }

    return true;
  }

  async #runScript(name) {
    if (this.scripts.has(name)) {
      name = this.scripts.get(name);
      return this.run(...name);
    }

    if (Array.isArray(name)) {
      const results = await Promise.all(name.map((n) => this.#runScript(n)));
      return (results.every((success) => success)) ? 0 : 1;
    }

    return this.#runCommand(name);
  }

  async #runCommand(command) {
    console.log(`⚡️ ${brightGreen(command)}`);
    const cmd = Array.from(command.matchAll(/('([^']*)'|"([^"]*)"|[\S]+)/g))
      .map((piece) => piece[2] || piece[1]);

    const process = Deno.run({ cmd, cwd: this.site.options.cwd });
    const status = await process.status();
    process.close();
    return status.success;
  }
}
