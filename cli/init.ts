import { brightGreen, cyan, dim, red } from "../deps/colors.ts";
import { pluginNames } from "./utils.ts";
import importMap from "./import_map.ts";

/** Generate a _config.js file */
export default function () {
  return init();
}

export async function init() {
  const plugins = await initConfig();
  await importMap({ plugins });
}

/** (Re)configure lume config file */
async function initConfig(): Promise<string[] | undefined> {
  const configFile = await getConfigFile();

  if (!configFile) {
    console.log();
    console.log("No config file created");
    return;
  }

  // Generate the code for the config file
  const code = [`import lume from "lume/mod.ts";`];

  const plugins = getPlugins();
  plugins.forEach((name) =>
    code.push(
      `import ${name} from "lume/plugins/${name}.ts";`,
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

  // Write the code to the file
  await Deno.writeTextFile(configFile, code.join("\n"));
  console.log();
  console.log(brightGreen("Lume configuration file saved:"), configFile);
  return plugins;
}

/** Question to get the list of plugins to install in the config file */
function getPlugins() {
  const message = `
${cyan("Do you want to use plugins?")}
Type the plugins separated by comma or space.

All available options:
${
    pluginNames.map((plugin) =>
      `- ${dim(plugin)} https://lume.land/plugins/${plugin}/`
    ).join("\n")
  }

Example: ${dim(`postcss terser base_path`)}
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
  const configFile = confirm(cyan("Use TypeScript for the configuration file?"))
    ? "_config.ts"
    : "_config.js";

  try {
    await Deno.lstat(configFile);
    return confirm(
        cyan(`The file "${configFile}" already exist. Override?`),
      )
      ? configFile
      : false;
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return configFile;
    }

    throw err;
  }
}
