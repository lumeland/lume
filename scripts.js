import { brightGreen } from "./deps/colors.js";
import { join } from "./deps/path.js";

export default class Scripts {
  scripts = new Map();

  constructor(site) {
    this.site = site;
  }

  set(name, ...commands) {
    this.scripts.set(name, parseCommands(commands));
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
      name = this.scripts.get(name);
      return this.run(options, ...name);
    }

    if (Array.isArray(name)) {
      const results = await Promise.all(
        name.map((n) => this.#runScript(options, n)),
      );
      return (results.every((success) => success)) ? 0 : 1;
    }

    if (typeof name === "function") {
      return this.#runFunction(name);
    }

    return this.#runCommand(options, name);
  }

  async #runFunction(fn) {
    const name = fn.name || "[Function]";
    console.log(`⚡️ ${brightGreen(name + "()")}`);
    await fn(this.site);
    return true;
  }

  async #runCommand(options, command) {
    console.log(`⚡️ ${brightGreen(command)}`);

    const cmd = Array.from(command.matchAll(/('([^']*)'|"([^"]*)"|\S+)/g))
      .map((piece) => piece[2] || piece[1]);

    if (cmd[0] === "cd") {
      options.cwd = join(options.cwd, cmd[1]);
      await Deno.stat(options.cwd);
      return true;
    }

    const process = Deno.run({ cmd, ...options });
    const status = await process.status();
    process.close();

    return status.success;
  }
}

function parseCommands(commands, result = []) {
  commands.forEach((command) => {
    if (typeof command === "string") {
      // Split the commands joined by " && " and " & "
      const subcommands = command.split(/\s+&&\s+/)
        .map((s) => s.includes(" & ") ? s.split(/\s+&\s+/) : s);

      result.push(...subcommands);
    } else if (Array.isArray(command)) {
      result.push(parseCommands(command));
    } else {
      result.push(command);
    }
  });

  return result;
}
