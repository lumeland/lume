import { parse } from "./deps/flags.js";
import { bold, brightGreen, red } from "./deps/colors.js";
import * as upgrade from "./cli/upgrade.js";
import * as init from "./cli/init.js";
import * as install from "./cli/install.js";
import * as build from "./cli/build.js";
import * as run from "./cli/run.js";
import { error as printError } from "./utils.js";

export const version = "v0.19.0";

const HELP = `
Docs: https://lumeland.github.io/

    To build the site:
        lume

    To serve the site in localhost:
        lume --serve

    To upgrade lume to the latest version:
        lume upgrade

    To run a custom script:
        lume run <script>

    To get help with a command:
        lume COMMAND --help

USAGE:
    lume [COMMAND] [OPTIONS]

COMMANDS:
    build      Build the site (Default command)
    init       Create a config file
    run        Run a custom script
    upgrade    Upgrade lume to the latest version
    install    Install the latest lume version

OPTIONS:
    -h, --help              print usage information
    -v, --version           print version information
        --root     <dir>    the root where lume should work     Default: ./
        --src      <dir>    the source directory for your site  Default: ./
        --dest     <dir>    the build destination               Default: _site
        --config   <file>   specify the lume config file        Default: _config.js
        --location <url>    the domain for your site            Default: http://localhost
    -d, --dev               enable dev mode (view draft pages)

    -s, --serve             start a live-reloading web server
    -p, --port     <port>   the port where the server runs      Default: 3000
    -o, --open              open the site in the browser
`;

if (import.meta.main) {
  try {
    await cli(Deno.args);
  } catch (error) {
    printError("lume", error.message, error);
  }
}

export default async function cli(args, site) {
  // The rest of the option parsing is handled within each command
  const options = parse(args, {
    boolean: ["help", "version"],
    alias: { help: "h", version: "v" },
    "--": true,
  });

  // lume --version
  if (options.version) {
    console.log(`🔥lume ${version}`);
    return;
  }

  // lume --help (with no command)
  if (options._.length === 0 && help(HELP)) {
    return;
  }

  // _ contains the non-option arguments
  const command = options._[0]?.toLowerCase() || "build";

  /**
   * print the given help message if the options asked for help
   *
   * @return true if help was printed, false otherwise
   */
  function help(message) {
    if (options.help) {
      console.log(`
🔥lume ${version}
A static site generator for Deno`);
      console.log(message);
      return true;
    } else {
      return false;
    }
  }

  /**
   * run the given command, or print it's help message, if it was the one requested
   *
   * @param name command name to compare to the cli argument
   * @param runner command code to run if this is the requested command
   */
  async function maybeRun(name, runner) {
    if (command === name) {
      help(runner.HELP) || await runner.run(args, site);
      return true;
    }
    return false;
  }

  // Check each command. If any of them ran, then return
  if (
    await maybeRun("build", build) ||
    await maybeRun("init", init) ||
    await maybeRun("run", run) ||
    await maybeRun("upgrade", upgrade) ||
    await maybeRun("install", install)
  ) {
    return;
  }

  // Down here means the command was not recognized
  throw new Error(`
    ${bold(red("error:"))} lume does not understand the command '${command}'

    Run ${brightGreen("lume --help")} for usage information
  `);
}
