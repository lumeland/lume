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
`;

export async function run(args, userSite) {
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

  // Should be 2 arguments "run" and the thing to run
  validateArgsCount("run", options._, 2);

  // Script name is the second argument ("run" is the first)
  const script = options._[1];

  const site = await buildSite(options, userSite);
  console.log();

  const success = await site.run(script);

  if (!success) {
    window.addEventListener("unload", () => Deno.exit(1));
  }
}
