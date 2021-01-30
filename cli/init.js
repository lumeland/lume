import { parse } from "../deps/flags.js";
import { brightGreen } from "../deps/colors.js";
import { version } from "../cli.js";
import { validateArgsCount } from "./cliUtils.js";

export const HELP = `
    ${brightGreen("lume init")}: create a config file for a new site
    
    USAGE:
        lume init [OPTIONS]
    
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
  validateArgsCount("init", options._, 1);

  Deno.writeTextFileSync(
    options.config,
    `import lume from "https://deno.land/x/lume@${version}/mod.js";

const site = lume();

export default site;
`,
  );
  console.log(brightGreen("Created config file"), options.config);
}
