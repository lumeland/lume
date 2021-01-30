import { brightGreen } from "../deps/colors.js";
import { parse } from "../deps/flags.js";
import { buildSite, validateArgsCount } from "./cliUtils.js";

export const HELP = `
${brightGreen("lume run")}: run a script in your site

USAGE:
    lume run <script>
`;
export async function run(args) {
  const options = parse(args, {
    boolean: ["dev"],
    string: ["src", "dest", "location", "root", "config"],
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

  // should be 2 arguments "run" and the thing to run
  validateArgsCount("run", options._, 2);

  // script name is the second argument ("run" is the first)
  const script = options._[1];

  const site = await buildSite(options);
  console.log("");
  site.run(script);
}
