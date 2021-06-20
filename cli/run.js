import { brightGreen } from "../deps/colors.js";
import { parse } from "../deps/flags.js";
import { buildSite, validateArgsCount } from "./utils.js";

export const HELP = `
${brightGreen("lume run")}: run a script from the lume config

USAGE:
    lume run [OPTIONS] <script>

OPTIONS:
        --root     <dir>    the root where lume should work     Default: ./
        --src      <dir>    the source directory for your site  Default: ./
        --dest     <dir>    the build destination               Default: _site
        --config   <file>   specify the lume config file        Default: _config.js
        --location <url>    the domain for your site            Default: http://localhost
    -d, --dev               enable dev mode (view draft pages)
        --verbose  <level>  different level of details (0/1/2)  Default: 1
`;

export async function run(args) {
  const options = parse(args, {
    string: ["root", "src", "dest", "config", "location"],
    boolean: ["dev"],
    alias: { dev: "d" },
    ["--"]: true,
    unknown(option) {
      if (option.startsWith("-")) {
        throw new Error(`Unknown option: ${option}`);
      }
    },
    default: {
      root: Deno.cwd(),
      config: "_config.js",
    },
  });

  // Should have 2 arguments: "run" and the thing to run
  validateArgsCount("run", options._, 10, 2);

  // Script name is the second argument ("run" is the first)
  const scripts = options._.slice(1);

  const site = await buildSite(options);
  console.log();

  for (const script of scripts) {
    const success = await site.run(script);

    if (!success) {
      window.addEventListener("unload", () => Deno.exit(1));
      break;
    }
  }
}
