import { brightGreen, gray } from "../deps/colors.ts";
import { pluginNames } from "../core/utils.ts";
import importMap from "./import_map.ts";
import { Checkbox, Confirm, Select } from "../deps/cliffy.ts";
import { outdent } from "../deps/outdent.ts";

/** Generate a _config.js file */
export default function (): Promise<void> {
  return init();
}

export async function init() {
  const plugins = await initConfig();
  await importMap({ plugins });
  welcome();
}

/** (Re)configure lume config file */
async function initConfig(): Promise<string[] | undefined> {
  const configFile = await getConfigFile();

  if (!configFile) {
    console.log();
    console.log("No config file created");
    return;
  }

  const plugins = await getPlugins();

  // Generate the code for the config file
  const code = [`import lume from "lume/mod.ts";`];

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

/**
 * Question to get the list of plugins to install in the config file
 * @returns Promise<string[]>
 */
async function getPlugins(): Promise<string[]> {
  const usePlugins = await Select.prompt({
    message: "Do you want to install some plugins now?",
    options: [
      {
        name: "Yes",
        value: "yes",
      },
      {
        name: "Maybe later",
        value: "no",
      },
    ],
    hint: "See all available plugins at https://lume.land/plugins/",
  });

  if (usePlugins === "no") {
    return [];
  }

  return Checkbox.prompt({
    message: "Select the plugins to install",
    options: pluginNames,
    hint: "Use Arrow keys and Space to select. Enter to submit",
  });
}

/** Question to get the filename of the config file */
async function getConfigFile(): Promise<string | false> {
  const file = await Select.prompt({
    message: "Choose the configuration file format",
    options: [
      {
        name: "_config.ts (TypeScript)",
        value: "_config.ts",
      },
      {
        name: "_config.js (JavaScript)",
        value: "_config.js",
      },
    ],
  });

  try {
    await Deno.lstat(file);
    const override = await Confirm.prompt({
      message: `The file "${file}" already exist. Override?`,
      default: false,
    });

    return override ? file : false;
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return file;
    }

    throw err;
  }
}

/** Show a welcome message */
function welcome() {
  const links = {
    help: brightGreen("deno task lume --help"),
    repo: gray("https://github.com/lumeland/lume"),
    website: gray("https://lume.land"),
    discord: gray("https://discord.gg/YbTmpACHWB"),
    opencollective: gray("https://opencollective.com/lume"),
  } as const;

  const message = outdent`

      🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥

      ${brightGreen(" Lume installed successfully!")}

          BENVIDO - WELCOME! 🎉🎉

      ${gray("-------------------------------")}

      Run ${links.help} for usage information
      See ${links.website} for online documentation
      See ${links.discord} to propose new ideas and get help at Discord
      See ${links.repo} to view the source code and report issues
      See ${links.opencollective} to provide some support
  
    `;

  console.log(message);
}
