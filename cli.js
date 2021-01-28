import {parse} from "./deps/flags.js";
import {brightGreen} from "./deps/colors.js";
import upgrade from "./cli/upgrade.js";
import update from "./cli/update.js";
import init from "./cli/init.js";
import build from "./cli/build.js";

if (import.meta.main) {
  cli(Deno.args);
}

export const version = "v0.14.0";

const USAGE = `
    Docs: https://lumeland.github.io/

        To build the site:
            lume

        To serve the site in localhost
            lume --serve

        To update lume to the latest version
            lume update

        To run a custom script
            lume run script-name

        To get help with a command
            lume COMMAND --help

    USAGE:
        lume [COMMAND] [OPTIONS]

    COMMANDS:
        build      Build the site. It's the default command
        init       Creates a _config.js file
        run        Run an user script
        upgrade    Upgrade 🔥lume to the latest version
        update     Update the version of the lume modules imported in a _config.js file

    OPTIONS:
        -h, --help     Prints help information
        -v, --version  Prints version information
            --root     Set a different root path (by default is cwd)
            --src      Set/override the src option
            --dest     Set/override the dest option
            --dev      Run lume in development mode
            --location Set/override the location option
            --serve    Starts the webserver
            --port     Change the default port of the webserver (from 3000)
`;

export default async function cli(args) {
  // the rest of the option parsing is handled within each command
  let options = parse(args, {
    boolean: ["help", "version"],
    alias: {help: "h", version: "v"},
  });

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

  // _ contains the non-option arguments
  const command = options._[0]?.toLowerCase();

  // lume [COMMAND] --help
  if (options.help) {
    if (!command) {
      help(version, USAGE);
    } else {
      const {USAGE} = await import(`./cli/${command}.js`)
      help(version, USAGE)
    }
    return;
  }

  // The Build command
  if (!command || command === "build") {
    await build(args);
    return;
  }

  // The Init command
  if (command === "init") {
    await init(args);
    return;
  }

  // The Update command
  if (command === "update") {
    await update(args);
    return;
  }

  // The Upgrade command
  if (command === "upgrade") {
    await upgrade(args);
    return;
  }

  // Down here means the command was not recognized
  console.log(`lume does now understand the command ${command}`)
  console.log(`Run ${brightGreen("lume --help")} for usage information`);
  console.log("");
  Deno.exit(1); // exit with a positive number to indicate failure
}

/**
 * Print a shared help header and then the given usage info
 */
function help(usageInfo) {
  console.log(`
    🔥lume ${version}
    
    A static site generator for Deno`);
  console.log(usageInfo)
}
