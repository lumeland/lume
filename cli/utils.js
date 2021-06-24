import { existsSync } from "../deps/fs.js";
import lume from "../mod.js";
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

function printDataError(error, indent = "") {
  if (!error.data) {
    return;
  }

  for (let [key, value] of Object.entries(error.data)) {
    if (key === "page") {
      value = value.src.path + value.src.ext;
    }

    console.log(dim(`    ${indent}${key}:`), value);
  }
}

export function printError(exception, indent = 0) {
  console.log();
  const tab = "  ".repeat(indent);

  console.error(`${tab}${bold(red(`Error:`))}`, exception);
  printDataError(exception, tab);

  if (exception.error) {
    printError(exception.error, indent + 1);
  }

  console.log();
}
