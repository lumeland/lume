import { brightGreen, cyan, dim } from "../deps/colors.ts";
import { pluginNames } from "../core/utils.ts";
import importMap from "./import_map.ts";
import { prompt, Input, Checkbox } from "../deps/cliffy.ts"
/** Generate a _config.js file */
export default (): Promise<void> => {
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
  const code = [`import lume from "https://deno.land/x/lume/mod.ts";`];

  const plugins = await getPlugins();
  plugins.forEach((name) =>
    code.push(
      `import ${name} from "https://deno.land/x/lume/plugins/${name}.ts";`,
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

/**
 * Question to get the list of plugins to install in the config file
 * @returns Promise<string[]>
 */
async function getPlugins(): Promise<string[]> {
  if (!confirm(cyan("Do you want to use plugins?"))) return [];

  // console.log(`${dim("Use ⭥ to navigate between plugins and 'space' to toggle y/n.")}`)

  const pluginsPrompt = await prompt([{ 
    name: "plugins",
    message: "All available options:",
    type: Checkbox, 
    options: pluginNames
  }])


  return pluginsPrompt.plugins ?? [];




}


/** Question to get the filename of the config file */
async function getConfigFile(): Promise<string | false> {
  const configFile = confirm(cyan("Use TypeScript for the configuration file?"))
    ? "_config.ts"
    : "_config.js";

  try {
    await Deno.lstat(configFile);
    return confirm(
      cyan(`The file "${configFile}" already exist.Override ? `),
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
