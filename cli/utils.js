import { existsSync } from "../deps/fs.js";
import lume, { overrides } from "../mod.js";
import { join, resolve, toFileUrl } from "../deps/path.js";
import { bold, brightGreen, dim, red } from "../deps/colors.js";

/**
 * Create and configure a site instance
 *
 * @param {Object} options user options to override
 * @return {Promise<*>} a lume instance - ready to build, run, etc.
 */
export async function buildSite(options) {
  options.root = resolve(Deno.cwd(), options.root);
  const configFile = join(options.root, options.config);

  overrides.cwd = options.root;

  if (options.dev) {
    overrides.dev = options.dev;
  }

  if (options.location) {
    overrides.location = new URL(options.location);
  }

  if (options.src) {
    overrides.src = options.src;
  }

  if (options.dest) {
    overrides.dest = options.dest;
  }

  if (options.port) {
    (overrides.server ||= {}).port = parseInt(options.port);
  }

  if (options.open) {
    (overrides.server ||= {}).open = options.open;
  }

  if ("metrics" in options) {
    overrides.metrics = options.metrics !== "false";
  }

  if (options["--"]) {
    overrides.flags = options["--"];
  }

  if (existsSync(configFile)) {
    const mod = await import(toFileUrl(configFile));
    return mod.default;
  }

  return lume();
}

/**
 * Validate the number of arguments passed to a command
 *
 * @param {string} command name of the command you're validating
 * @param {[]} args array of cli arguments (i.e. options._)
 * @param {number} max the max number of args
 * @param {number} min the min number of args
 */
export function validateArgsCount(command, args, max, min = 0) {
  if (args.length > max) {
    throw new Error(`Unexpected arguments: ${args.slice(max).join(", ")}

    Run ${brightGreen(`lume ${command} --help`)} for usage information
    `);
  }

  if (args.length < min) {
    throw new Error(`Missing arguments

    Run ${brightGreen(`lume ${command} --help`)} for usage information
    `);
  }
}

export function getCurrentVersion() {
  const url = new URL("../", import.meta.url).pathname;
  return url.match(/@([^/]+)/)?.[1] ?? `local (${url})`;
}

export function printError(exception, debug = false) {
  console.log();
  console.error(bold(red(`Error:`)), exception.message);

  printDataError(exception);

  if (debug) {
    console.error(exception);
  }

  if (exception.error) {
    let { error } = exception;
    let indent = "  ";
    while (error) {
      console.log();
      console.log(red(`${indent}${error.message}`));
      printDataError(error, indent);
      indent += "  ";

      if (debug) {
        console.error(error);
      }

      error = error.error;
    }
  }

  console.log();
}

function printDataError(error, indent = "") {
  if (!error.data) {
    return;
  }

  for (let [key, value] of Object.entries(error.data)) {
    if (key === "page") {
      value = value.src.path + value.src.ext;
    }

    console.log(dim(`${indent}${key}:`), value);
  }
}
