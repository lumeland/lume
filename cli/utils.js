import { existsSync } from "../deps/fs.js";
import lume from "../mod.js";
import { join, resolve } from "../deps/path.js";
import { brightGreen } from "../deps/colors.js";

/**
 * @return {Promise<*>} a lume instance - ready to build, run, etc.
 */
export async function buildSite(options, site) {
  options.root = resolve(Deno.cwd(), options.root);
  const configFile = join(options.root, options.config);

  if (!site) {
    if (existsSync(configFile)) {
      const mod = await import(`file://${configFile}`);
      site = mod.default;
    } else {
      site = lume();
    }
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

  return site;
}

/**
 * @param command name of the command you're validating
 * @param args array of cli arguments (i.e. options._)
 * @param max the max number of args
 * @param min the min number of args
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
