import { brightGreen, gray } from "./deps/colors.ts";
import { pluginNames } from "./core/utils/lume_config.ts";
import { checkDenoSupport } from "./core/utils/lume_version.ts";
import {
  updateLumeVersion,
  writeDenoConfig,
} from "./core/utils/deno_config.ts";
import { Checkbox, Confirm, Select } from "./deps/cliffy.ts";
import { outdent } from "./deps/outdent.ts";
import { join } from "./deps/path.ts";
import { ensureDir } from "./deps/fs.ts";

import type { DenoConfigResult } from "./core/utils/deno_config.ts";

checkDenoSupport();
const folder = Deno.args[0] || ".";

/** Init Lume in the current directory */
const configFile = await getConfigFile(folder);

if (!configFile) {
  console.log(gray("Lume init cancelled."));
  Deno.exit();
}

const plugins = await getPlugins();

const denoConfig: DenoConfigResult = {
  config: {},
  file: join(folder, "deno.json"),
};

initPlugins(plugins, denoConfig);

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

// Generate the code for the cms config file
const cmsConfig = await getCms(configFile);
const cmsCode: string[] = [];

if (cmsConfig) {
  cmsCode.push(
    'import lumeCMS from "lume/cms.ts";',
    "",
    "const cms = lumeCMS();",
    "",
    "export default cms;",
    "",
  );
}

// Write the code to the file
await ensureDir(folder);
await Deno.writeTextFile(configFile, code.join("\n"));
console.log();
console.log("Lume configuration file saved:", gray(configFile));

if (cmsConfig) {
  await Deno.writeTextFile(cmsConfig, cmsCode.join("\n"));
  console.log("CMS configuration file saved:", gray(cmsConfig));
}

const url = new URL(import.meta.resolve("./"));
updateLumeVersion(url, denoConfig);
writeDenoConfig(denoConfig);

const links = {
  serve: brightGreen("deno task serve"),
  repo: gray("https://github.com/lumeland/lume"),
  website: gray("https://lume.land"),
  discord: gray("https://discord.gg/YbTmpACHWB"),
  opencollective: gray("https://opencollective.com/lume"),
} as const;

const message = outdent`

  🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥

  ${brightGreen(" Lume configured successfully!")}

      BENVIDO - WELCOME! 🎉🎉

  🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥

  Quick start:
    Create the index.md file and write some content
    Run ${links.serve} to start a local server

  See ${links.website} for online documentation
  See ${links.discord} to propose new ideas and get help at Discord
  See ${links.repo} to view the source code and report issues
  See ${links.opencollective} to support Lume development

`;

console.log(message);

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
async function getConfigFile(folder: string): Promise<string | false> {
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

  const path = join(folder, file);

  try {
    await Deno.lstat(path);
    const override = await Confirm.prompt({
      message: `The file "${path}" already exist. Override?`,
      default: false,
    });

    return override ? path : false;
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return path;
    }

    throw err;
  }
}

/** Question to get the cms config file */
async function getCms(configPath: string): Promise<string | false> {
  const useCms = await Select.prompt({
    message: "Do you want to setup a CMS?",
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
    hint: "More info at https://lume.land/cms/",
  });

  if (!useCms) {
    return false;
  }

  const path = configPath.replace(/_config\.(ts|js)$/, "_cms.$1");

  try {
    await Deno.lstat(path);
    const override = await Confirm.prompt({
      message: `The file "${path}" already exist. Override?`,
      default: false,
    });

    return override ? path : false;
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return path;
    }

    throw err;
  }
}

function initPlugins(plugins: string[], denoConfig: DenoConfigResult) {
  // Ensure that jsx and jsx_preact are not used at the same time and are loaded before mdx
  if (plugins.includes("mdx")) {
    const jsx = plugins.indexOf("jsx");
    const jsx_preact = plugins.indexOf("jsx_preact");

    if (jsx !== -1 && jsx_preact !== -1) {
      throw new Error(
        "You can't use both the jsx and jsx_preact plugins at the same time.",
      );
    }

    if (jsx !== -1) {
      // Ensure jsx is loaded before mdx
      plugins.splice(jsx, 1);
      plugins.unshift("jsx");
    } else if (jsx_preact !== -1) {
      // Ensure jsx_preact is loaded before mdx
      plugins.splice(jsx_preact, 1);
      plugins.unshift("jsx_preact");
    } else {
      // Use jsx by default
      plugins.unshift("jsx");
    }
  }

  if (plugins.includes("jsx")) {
    denoConfig.config.compilerOptions ||= {};
    denoConfig.config.compilerOptions.jsx = "react-jsx";
    denoConfig.config.compilerOptions.jsxImportSource = "npm:react";

    // Add React types:
    denoConfig.config.compilerOptions.types ||= [];
    denoConfig.config.compilerOptions.types.push(
      "https://unpkg.com/@types/react@18.2.47/index.d.ts",
    );
  }

  if (plugins.includes("jsx_preact")) {
    denoConfig.config.compilerOptions ||= {};
    denoConfig.config.compilerOptions.jsx = "precompile";
    denoConfig.config.compilerOptions.jsxImportSource = "npm:preact";
  }

  // Ensure that tailwindcss is loaded before postcss
  fixPluginOrder(plugins, "tailwindcss", "postcss");

  // Ensure that picture is loaded before transform_images
  fixPluginOrder(plugins, "picture", "transform_images");
}

function fixPluginOrder(plugins: string[], plugin1: string, plugin2: string) {
  if (plugins.includes(plugin1)) {
    const pos1 = plugins.indexOf(plugin1);
    const pos2 = plugins.indexOf(plugin2);

    if (pos2 === -1) {
      plugins.splice(pos1 + 1, 0, plugin2);
      return;
    }

    if (pos1 > pos2) {
      plugins[pos2] = plugin1;
      plugins[pos1] = plugin2;
    }
  }
}
