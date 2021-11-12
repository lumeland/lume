import { exists } from "../deps/fs.ts";
import { posix } from "../deps/path.ts";
import { brightGreen, dim, red } from "../deps/colors.ts";
import { pluginNames } from "./utils.ts";

interface Options {
  only?: "config" | "vscode";
}

/** Generate a _config.js file */
export default async function init({ only }: Options) {
  const path = new URL("..", import.meta.url).href;

  if (only === "config") {
    return await initConfig(path);
  }

  if (only === "vscode") {
    return await initVSCode(path);
  }

  await initConfig(path);

  if (confirm(brightGreen("Do you want to configure VS Code?"))) {
    return await initVSCode(path);
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
async function initVSCode(path: string) {
  try {
    await Deno.mkdir(".vscode");
  } catch {
    // Ignore if the directory already exists
  }

  // Enable Deno plugin
  const config = await exists(".vscode/settings.json")
    ? JSON.parse(await Deno.readTextFile(".vscode/settings.json"))
    : {};

  config["deno.enable"] = true;
  config["deno.lint"] = true;
  config["deno.unstable"] = true;
  config["deno.suggest.imports.hosts"] = {
    "https://deno.land": true,
  };

  // Set up the import map
  config["deno.importMap"] = ".vscode/lume_import_map.json";

  const importMap = {
    imports: {
      "lume": posix.join(path, "/mod.ts"),
      "lume/": posix.join(path, "/"),
      "https://deno.land/x/lume/": posix.join(path, "/"),
    },
  };

  // Create a launch.json file to debug
  // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
  const baseConfig = {
    request: "launch",
    type: "pwa-node",
    program: posix.join(path, "/cli.ts"),
    cwd: "${workspaceFolder}",
    runtimeExecutable: "deno",
    runtimeArgs: [
      "run",
      "--unstable",
      "--import-map=.vscode/lume_import_map.json",
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
    ".vscode/lume_import_map.json",
    JSON.stringify(importMap, null, 2),
  );
  await Deno.writeTextFile(
    ".vscode/launch.json",
    JSON.stringify(launch, null, 2),
  );
  console.log(brightGreen("VS Code configured"));
}

/** Question to get the style to import lume in the config file */
function getLumeUrl(path: string) {
  const message = `
${brightGreen("How do you want to import lume?")}
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
${brightGreen("Do you want to import plugins?")}
Type the plugins you want to use separated by comma.

All available options:
${
    pluginNames.map((plugin) =>
      `- ${dim(plugin)} https://lumeland.github.io/plugins/${plugin}/`
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
    console.log(red(`Ignored not found plugin ${plugin}.`));
    return false;
  });
}

/** Question to get the filename of the config file */
async function getConfigFile(): Promise<string | false> {
  const configFile =
    confirm(brightGreen("Use Typescript for the configuration file?"))
      ? "_config.ts"
      : "_config.js";

  if (await exists(configFile)) {
    return confirm(
        brightGreen(`The file "${configFile}" already exist. Override?`),
      )
      ? configFile
      : false;
  }

  return configFile;
}
