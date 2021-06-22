import { posix } from "../deps/path.ts";
import { parse } from "../deps/flags.ts";
import { brightGreen } from "../deps/colors.ts";
import { validateArgsCount } from "./utils.js";

export const HELP = `
${brightGreen("lume init")}: create a config file for a new site

USAGE:
    lume init [OPTIONS]

OPTIONS:
    --config      <file>      specify the lume config file               Default: _config.js
    --import-map  true|false  whether to use the import map or full URL  Default: true
    --plugins     <plugins>   a comma-separated list of plugins to use
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
    : new URL("..", import.meta.url).href;

  const plugins = options.plugins ? options.plugins.split(",").sort() : [];
  const code = [`import lume from "${posix.join(lumeUrl, "mod.js")}";`];

  plugins.forEach((name) =>
    code.push(
      `import ${name} from "${posix.join(lumeUrl, `plugins/${name}.js`)}";`,
    )
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
