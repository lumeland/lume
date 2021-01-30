import { parse } from "../deps/flags.js";
import { exists } from "../deps/fs.js";
import { error } from "../utils.js";
import { brightGreen, gray } from "../deps/colors.js";
import { version } from "../cli.js";

export const HELP = `
    ${
  brightGreen("lume update")
}: update your site's config file to use the latest version of lume from deno.land
    
    USAGE:
        lume update [OPTIONS]
    
    OPTIONS:
        --config <file> specify the lume config file.   Default: _config.js
`;

export async function run(args) {
  const options = parse(args, {
    string: ["config"],
    unknown(option) {
      if (option.startsWith("-")) {
        throw new Error(`Unknown option: ${option}`);
      }
    },
    default: {
      config: "_config.js",
    },
  });

  if (!await exists(options.config)) {
    error("error", `The file ${options.config} does not exists`);
    return;
  }

  const content = await Deno.readTextFile(options.config);
  const updated = content.replaceAll(
    /https:\/\/deno\.land\/x\/lume(@v[\d\.]+)?\/(.*)/g,
    (m, v, path) => `https://deno.land/x/lume@${version}/${path}`,
  );

  if (content === updated) {
    console.log("No changes required in", gray(options.config));
    console.log("");
    return;
  }

  await Deno.writeTextFile(options.config, updated);

  console.log(
    `Updated lume modules to ${brightGreen(version)} in`,
    gray(options.config),
  );
  console.log("");
}
