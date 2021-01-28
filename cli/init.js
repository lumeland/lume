import {parse} from "../deps/flags.js";
import {brightGreen} from "../deps/colors.js";
import {version} from "../cli.js";

export const USAGE = `
    ${brightGreen("lume init")}: create a _config.js file for a new site
    
    USAGE:
        lume init [OPTIONS]
    
    OPTIONS:
        --config <file>     specify the lume config file.   Default: _config.js
    
`
export default async function init(args) {
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
  })
  Deno.writeTextFileSync(
      options.config,
      `import lume from "https://deno.land/x/lume@${version}/mod.js";

const site = lume();

export default site;
`,
  );
  console.log(brightGreen("Created config file"), options.config);
}
