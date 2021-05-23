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
    --plugins     <plugins>   comma-separated list of plugins to use
`;

export async function run(args) {
  const options = parse(args, {
    string: ["config", "plugins"],
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
    ? "lume"
    : `https://deno.land/x/lume@${version}`;

  const plugins = options.plugins ? options.plugins.split(",").sort() : [];
  const code = [`import lume from "${lumeUrl}/mod.js";`];

  plugins.forEach((name) =>
    code.push(`import ${name} from "${lumeUrl}/plugins/${name}.js";`)
  );
  code.push("");
  code.push("const site = lume();");

  if (plugins.length) {
    code.push("");
    plugins.forEach((name) => code.push(`site.use(${name}());`));
  }

  code.push("");
  code.push("export default site;");
  code.push("");

  await Deno.writeTextFile(options.config, code.join("\n"));
  console.log(brightGreen("Created a config file"), options.config);
}
