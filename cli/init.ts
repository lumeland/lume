import { exists } from "../deps/fs.ts";
import { posix } from "../deps/path.ts";
import { brightGreen, cyan, dim, red } from "../deps/colors.ts";
import { pluginNames } from "./utils.ts";
import importMap from "./import_map.ts";

/** Generate a _config.js file */
export default async function init() {
  const path = new URL("..", import.meta.url).href;

  await initConfig(path);

  let importMapFile: string | undefined = undefined;

  if (confirm(cyan("Do you want to create a import map file?"))) {
    const file = await getImportMapFile();

    if (file) {
      await importMap({ file });
      importMapFile = file;
    }
  }

  if (confirm(cyan("Do you want to configure VS Code?"))) {
    return await initVSCode(path, importMapFile);
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

/** (Re)configure VSCode for Deno/Lume */
async function initVSCode(path: string, importMapFile: string | undefined) {
  try {
    await Deno.mkdir(".vscode");
  } catch {
    // Ignore if the directory already exists
  }

  // Enable Deno plugin
  let config: Record<string, unknown> = {};

  try {
    const existing = await Deno.readTextFile(".vscode/settings.json");
    config = JSON.parse(existing);
  } catch {
    // ignore
  }

  config["deno.enable"] = true;
  config["deno.lint"] = true;
  config["deno.unstable"] = true;
  config["deno.suggest.imports.hosts"] = {
    "https://deno.land": true,
  };

  if (!importMapFile) {
    importMapFile = ".vscode/lume_import_map.json";
    await importMap({ file: importMapFile });
  }

  // Set up the import map
  config["deno.importMap"] = importMapFile;

  // Create a launch.json file to debug
  // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
  const baseConfig = {
    request: "launch",
    type: "pwa-node",
    program: path.startsWith("https://")
      ? new URL("./cli.ts", path).href
      : posix.join(path, "/cli.ts"),
    cwd: "${workspaceFolder}",
    runtimeExecutable: "deno",
    runtimeArgs: [
      "run",
      "--unstable",
      `--import-map=${importMapFile}`,
      "--inspect",
      "--allow-all",
    ],
    attachSimplePort: 9229,
  };

  const launch = {
    "version": "0.2.0",
    "configurations": [
      Object.assign({}, baseConfig, {
        name: "Lume build",
      }),
      Object.assign({}, baseConfig, {
        name: "Lume serve",
        args: ["--serve"],
      }),
    ],
  };

  await Deno.writeTextFile(
    ".vscode/settings.json",
    JSON.stringify(config, null, 2),
  );
  await Deno.writeTextFile(
    ".vscode/launch.json",
    JSON.stringify(launch, null, 2),
  );
  console.log();
  console.log(brightGreen("VS Code configured"));
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

/** Question to get the filename of the import_map file */
async function getImportMapFile(): Promise<string | false> {
  const importMapFile = prompt(
    cyan("Name of the import map file?"),
    "import_map.json",
  );

  if (!importMapFile) {
    return false;
  }

  if (await exists(importMapFile)) {
    return confirm(
        cyan(`The file "${importMapFile}" already exist. Update it?`),
      )
      ? importMapFile
      : false;
  }

  return importMapFile;
}
