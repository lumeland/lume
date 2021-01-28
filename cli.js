import {parse} from "./deps/flags.js";
import {bold, brightGreen, red} from "./deps/colors.js";
import upgrade from "./cli/upgrade.js";
import update from "./cli/update.js";
import init from "./cli/init.js";
import build from "./cli/build.js";
import run from "./cli/run.js";

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
        run        Run an site script
        upgrade    Upgrade 🔥lume to the latest version
        update     Update the version of the lume modules imported in a _config.js file


    OPTIONS:
        -h, --help              print usage information
        -v, --version  Prints version information
            --root <dir>        the root that lume should work in   Default: ./
            --src  <dir>        the source directory for your site  Default: ./
            --dest  <dir>       the build destination.              Default: _site
            --config <file>     specify the lume config file.       Default: _config.js
            --location <domain> set the domain for your site.       Default: http://localhost
            --dev               enable dev mode (view draft pages)
            
            --serve             start a live-reloading web server
            --port <port>       the port the server is on           Default: 3000
`;


if (import.meta.main) {
  await cli(Deno.args);
}

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
    let usage;
    if (command) {
      const commandModule = await import(`./cli/${command}.js`).catch(_ => {
      }) //ignore import errors here
      usage = commandModule?.USAGE
    } else {
      usage = USAGE;
    }

    if (usage) {
      help(usage)
      return;
    }
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

  if (command === "run") {
    await run(args);
    return;
  }

  // Down here means the command was not recognized
  console.log(`
    ${bold(red("error:"))} lume does not understand the command '${command}'
    
    Run ${brightGreen("lume --help")} for usage information
  `);
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
