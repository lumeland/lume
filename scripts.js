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

  async run(...names) {
    const options = {
      cwd: this.site.options.cwd,
    };

    for (const name of names) {
      const success = await this.#runScript(name, options);

      if (!success) {
        return false;
      }
    }

    return true;
  }

  async #runScript(name, options) {
    if (this.scripts.has(name)) {
      name = this.scripts.get(name);
      return this.run(...name);
    }

    if (Array.isArray(name)) {
      const results = await Promise.all(
        name.map((n) => this.#runScript(n, options)),
      );
      return (results.every((success) => success)) ? 0 : 1;
    }

    return this.#runCommand(name, options);
  }

  async #runCommand(command, options) {
    console.log(`⚡️ ${brightGreen(command)}`);
    const cmd = Array.from(command.matchAll(/('([^']*)'|"([^"]*)"|[\S]+)/g))
      .map((piece) => piece[2] || piece[1]);

    const process = Deno.run({ cmd, ...options });
    const status = await process.status();
    process.close();

    if (cmd[0] === "cd") {
      options.cwd = join(options.cwd, cmd[1]);
    }

    return status.success;
  }
}

function parseCommands(commands, result = []) {
  commands.forEach((command) => {
    if (typeof command === "string") {
      //Split the commands joined by " && " and " & "
      const subcommands = command.split(/\s+&&\s+/)
        .map((s) => s.includes(" & ") ? s.split(/\s+&\s+/) : s);

      result.push(...subcommands);
    } else {
      result.push(parseCommands(command));
    }
  });

  return result;
}
