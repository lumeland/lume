import { exists } from "../deps/fs.ts";
import { posix } from "../deps/path.ts";
import { brightGreen, dim, red } from "../deps/colors.ts";
import { pluginNames } from "./utils.ts";

/** Generate a _config.js file */
export default async function init() {
  const thisLume = new URL("..", import.meta.url).href;

  const lumeUrl = getLumeUrl(thisLume);
  const plugins = getPlugins();
  const configFile = getConfigFile();
  const vsCode = configureVSCode();

  // Generate the code for the config file
  const code = [`import lume from "${posix.join(lumeUrl, "mod.ts")}";`];

  plugins.forEach((name) =>
    code.push(
      `import ${name} from "${posix.join(lumeUrl, `plugins/${name}.ts`)}";`,
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

  // Configure VS Code
  if (vsCode) {
    if (!await exists(".vscode")) {
      await Deno.mkdir(".vscode");
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
        "lume": posix.join(thisLume, "/mod.ts"),
        "lume/": posix.join(thisLume, "/"),
        "https://deno.land/x/lume/": posix.join(thisLume, "/"),
      },
    };

    // Create a launch.json file to debug
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    const launch = {
      "version": "0.2.0",
      "configurations": [
        {
          "name": "Lume build",
          "request": "launch",
          "type": "pwa-node",
          "program": ".vscode/lume_launch.ts",
          "cwd": "${workspaceFolder}",
          "runtimeExecutable": "deno",
          "runtimeArgs": [
            "run",
            "--unstable",
            "--import-map=.vscode/lume_import_map.json",
            "--inspect",
            "--allow-all",
          ],
          "attachSimplePort": 9229,
        },
      ],
    };

    const launchLume = `
import site from "../${configFile}";
site.build();
`;

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
    await Deno.writeTextFile(
      ".vscode/lume_launch.ts",
      launchLume,
    );
    console.log(brightGreen("VS Code configured"));
  }

  // Write the code to the file
  await Deno.writeTextFile(configFile, code.join("\n"));
  console.log();
  console.log(brightGreen("Created a config file"), configFile);
}

function getLumeUrl(lumeUrl: string) {
  const message = `
${brightGreen("How do you want to import lume?")}
Type a number:
1 ${dim('import lume from "lume/mod.ts"')}
2 ${dim('import lume from "https://deno.land/x/lume/mod.ts"')}
3 ${dim(`import lume from "${posix.join(lumeUrl, "mod.ts")}"`)}
`;
  const choice = prompt(message, "1");

  switch (choice) {
    case "1":
      return "lume";
    case "2":
      return "https://deno.land/x/lume/";
  }
  return lumeUrl;
}

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

function getConfigFile() {
  const message = `
${brightGreen("Use Typescript for the configuration file?")}
`;
  return confirm(message) ? "_config.ts" : "_config.js";
}

function configureVSCode() {
  const message = `
${brightGreen("Do you want to configure VS Code?")}
`;
  return confirm(message);
}
