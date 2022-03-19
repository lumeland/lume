import { exists } from "../deps/fs.ts";
import { posix } from "../deps/path.ts";
import { brightGreen, cyan, dim, red } from "../deps/colors.ts";
import { pluginNames } from "./utils.ts";
import importMap from "./import_map.ts";

/** Generate a _config.js file */
export default function () {
  return init();
}

export async function init() {
  const path = new URL("..", import.meta.url).href;

  await initConfig(path);

  if (confirm(cyan("Do you want to create a import map file?"))) {
    await importMap();
  }
}

/** (Re)configure lume config file */
async function initConfig(path: string) {
  const configFile = await getConfigFile();

  if (!configFile) {
    console.log();
    console.log("No config file created");
    return;
  }

  // Get the import path style
  path = getLumeUrl(path);

  // Generate the code for the config file
  const code = [`import lume from "${posix.join(path, "mod.ts")}";`];

  const plugins = getPlugins();
  plugins.forEach((name) =>
    code.push(
      `import ${name} from "${posix.join(path, `plugins/${name}.ts`)}";`,
    )
  );
  code.push("");
  code.push("const site = lume();");

  if (plugins.length) {
    code.push("");
    plugins.sort().forEach((name) => code.push(`site.use(${name}());`));
  }

  code.push("");
  code.push("export default site;");
  code.push("");

  // Write the code to the file
  await Deno.writeTextFile(configFile, code.join("\n"));
  console.log();
  console.log(brightGreen("Created a config file"), configFile);
}

/** Question to get the style to import lume in the config file */
function getLumeUrl(path: string) {
  const message = `
${cyan("How do you want to import lume?")}
Type a number:
1 ${dim('import lume from "lume/mod.ts"')}
2 ${dim('import lume from "https://deno.land/x/lume/mod.ts"')}
3 ${dim(`import lume from "${posix.join(path, "mod.ts")}"`)}
`;
  const choice = prompt(message, "1");

  switch (choice) {
    case "1":
      return "lume";
    case "2":
      return "https://deno.land/x/lume/";
  }
  return path;
}

/** Question to get the list of plugins to install in the config file */
function getPlugins() {
  const message = `
${cyan("Do you want to use plugins?")}
Type the plugins separated by comma.

All available options:
${
    pluginNames.map((plugin) =>
      `- ${dim(plugin)} https://lume.land/plugins/${plugin}/`
    ).join("\n")
  }

Example: ${dim(`postcss, terser, base_path`)}
`;
  const choice = prompt(message);
  const plugins = choice ? choice.split(/[\s,]+/) : [];

  // Validate the plugins
  return plugins.filter((plugin) => {
    if (pluginNames.includes(plugin)) {
      return true;
    }
    console.log(red(`Ignored not valid plugin ${plugin}.`));
    return false;
  });
}

/** Question to get the filename of the config file */
async function getConfigFile(): Promise<string | false> {
  const configFile = confirm(cyan("Use Typescript for the configuration file?"))
    ? "_config.ts"
    : "_config.js";

  if (await exists(configFile)) {
    return confirm(
        cyan(`The file "${configFile}" already exist. Override?`),
      )
      ? configFile
      : false;
  }

  return configFile;
}
