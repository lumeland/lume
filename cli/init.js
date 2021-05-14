import { parse } from "../deps/flags.js";
import { brightGreen } from "../deps/colors.js";
import { version } from "../cli.js";
import { validateArgsCount } from "./utils.js";

export const HELP = `
${brightGreen("lume init")}: create a config file for a new site

USAGE:
    lume init [OPTIONS]

OPTIONS:
    --config      <file>      specify the lume config file               Default: _config.js
    --import-map  true|false  whether to use the import map or full URL  Default: true
`;

export async function run(args) {
  const options = parse(args, {
    string: ["config"],
    boolean: ["import-map"],
    unknown(option) {
      if (option.startsWith("-")) {
        throw new Error(`Unknown option: ${option}`);
      }
    },
    default: {
      config: "_config.js",
      "import-map": true,
    },
  });

  validateArgsCount("init", options._, 1);

  const lumeUrl = options["import-map"]
    ? `lume/mod.js`
    : `https://deno.land/x/lume@${version}/mod.js`;

  await Deno.writeTextFile(
    options.config,
    `import lume from "${lumeUrl}";

const site = lume();

export default site;
`,
  );
  console.log(brightGreen("Created a config file"), options.config);
}
