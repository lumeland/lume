import { existsSync } from "./deps/fs.js";
import { parse } from "./deps/flags.js";
import { brightGreen } from "./deps/colors.js";
import { join } from "./deps/path.js";
import lume from "./mod.js";
import upgrade from "./cli/upgrade.js";
import update from "./cli/update.js";
import init from "./cli/init.js";
import help from "./cli/help.js";
import build from "./cli/build.js";

if (import.meta.main) {
  cli(Deno.args);
}

export const validCommands = [
    "build"
] as const;
export type ValidCommands = typeof validCommands[number]

export interface CliOption {
  name: string;
  short?: string;
  description: string;
}
export interface CliCommand {
  name: string;
  description: string;
  options?: CliOption[];
}

export const globalOptions: CliOption[] = [
  {
    name: "help",
    short: "h",
    description: "Print usage information"
  }
]

export default async function cli(args) {
  const version = "v0.14.0";

  // handle --help and --version fast
  let options = parse(args, {
    boolean: ["help", "version"],
    alias: {help: "h", version: "v"},
  });

  // lume --help
  if (options.help) {
    return help(version);
  }

  // lume --version
  if (options.version) {
    console.log(`🔥lume ${version}`);
    return;
  }


  if (options._.length > 1) {
    console.log(`Too many arguments: ${options._.join(", ")}`);
    console.log(`Run ${brightGreen("lume --help")} for usage information`);
    console.log("");
    Deno.exit(1);
  }

  // handle the various commands
  const command = options._[0]?.toLowerCase() || "build";

  // The Build command
  if (command === "build") {
    await build(args);
    return;
  }

}
function old_cli(args) {
  let stop = false;
  const options = parse(args, {
    boolean: ["serve", "init", "version", "dev", "help", "upgrade", "update"],
    string: ["run", "port", "src", "dest", "location", "root", "config"],
    alias: {
      help: "h",
      version: "v",
    },
    ["--"]: true,
    unknown(option) {
      if (option.startsWith("-")) {
        console.log(`Unknown option: ${option}`);
        stop = true;
      }
    },
    default: {
      root: Deno.cwd(),
      config: "_config.js",
    },
  });


  if (stop) {
    console.log(`Run ${brightGreen("lume --help")} for usage information`);
    console.log("");
    return;
  }

  // lume upgrade
  if (command === "upgrade") {
    return upgrade(version);
  }

  // lume update
  if (command === "update") {
    const file = options._[0] || "_config.js";
    return update(file, version);
  }

  const configFile = join(option.root, option.config);

  // lume init
  if (command === "init") {
    return init(configFile, version);
  }

  let site;

  if (existsSync(configFile)) {
    const mod = await import(`file://${configFile}`);
    site = mod.default;
  } else {
    site = lume({ cwd });
  }

  site.options.cwd = options.root;

  if (options.dev) {
    site.options.dev = options.dev;
  }

  if (options.location) {
    site.options.location = new URL(options.location);
  }

  if (options.src) {
    site.options.src = options.src;
  }

  if (options.dest) {
    site.options.dest = options.dest;
  }

  if (options["--"]) {
    site.options.flags = options["--"];
  }

  // lume run
  if (command === "run") {
    await site.run(options.run);
    return;
  }

  // lume build
  if (command === "build") {
    return build(site, option.serve);
  }
}
