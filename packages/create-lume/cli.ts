#!/usr/bin/env node

import process from "node:process";
import path from "node:path";
import fs, { realpathSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { styleText } from "node:util";
import * as prompts from "@clack/prompts";
import cac from "cac";

const pkgManagers = ["npm", "yarn", "pnpm", "bun"] as const;
type PkgManager = (typeof pkgManagers)[number];

const plugins: Record<string, [string, string?]> = {
  basePath: ["base-path"],
  checkUrls: ["check-urls"],
  codeHighlight: ["code-highlight"],
  compress: ["compress"],
  date: ["date"],
  epub: ["epub"],
  esbuild: ["esbuild"],
  eta: ["eta"],
  extractDate: ["extract-date"],
  extractOrder: ["extract-order"],
  favicon: ["favicon"],
  feed: ["feed"],
  filterPages: ["filter-pages"],
  gitDate: ["git-date"],
  gitInfo: ["git-info"],
  googleFonts: ["google-fonts"],
  icons: ["icons"],
  imageSize: ["image-size"],
  inline: ["inline"],
  jsonLd: ["json-ld"],
  jsx: ["jsx"],
  katex: ["katex"],
  lightningcss: ["lightningcss"],
  markdownFootnotes: ["markdown-footnotes"],
  mdx: ["mdx"],
  metas: ["metas"],
  minifyHtml: ["minify-html"],
  modifyUrls: ["modify-urls"],
  multilanguage: ["multilanguage"],
  nav: ["nav"],
  nunjucks: ["nunjucks"],
  ogImages: ["og-images"],
  pagefind: ["pagefind"],
  partytown: ["partytown"],
  picture: ["picture"],
  plaintext: ["plaintext"],
  postcss: ["postcss"],
  prism: ["prism"],
  pug: ["pug"],
  purgecss: ["purgecss"],
  pwa: ["pwa"],
  readingInfo: ["reading-info"],
  redirects: ["redirects"],
  relativeUrls: ["relative-urls"],
  remark: ["remark"],
  replace: ["replace"],
  resolveUrls: ["resolve-urls"],
  robots: ["robots"],
  sass: ["sass"],
  search: ["search"],
  sheets: ["sheets"],
  sitemap: ["sitemap"],
  slugifyUrls: ["slugify-urls"],
  sourceMaps: ["source-maps"],
  sri: ["sri"],
  svgo: ["svgo"],
  tailwindcss: ["tailwindcss"],
  terser: ["terser"],
  toc: ["toc"],
  transformImages: ["transform-images"],
  unocss: ["unocss"],
  validateHtml: ["validate-html"],
  wellKnown: ["well-known"],
};

interface InitOptions {
  js?: boolean;
  src?: string;
  theme?: string;
  pkgManager?: string;
}

async function init(targetDir: string | undefined, options: InitOptions) {
  const cwd = process.cwd();
  const cancel = () => prompts.cancel("Operation cancelled");
  const pkgManager = getPackageManager(options.pkgManager);

  prompts.intro("Create a Lume site");

  // 1. Target dir
  if (targetDir) targetDir = formatTargetDir(targetDir);

  if (!targetDir) {
    const projectName = await prompts.text({
      message: "Project directory:",
      defaultValue: "lume-site",
      placeholder: "lume-site",
      validate: (value) => {
        return !value || formatTargetDir(value).length > 0 ? undefined : "Invalid project name";
      },
    });
    if (prompts.isCancel(projectName)) return cancel();
    targetDir = formatTargetDir(projectName);
  }

  const root = path.join(cwd, targetDir);

  // 2. Handle directory if exist and not empty
  if (fs.existsSync(root) && !isEmpty(root)) {
    if (
      isDenoProject(root) &&
      (await prompts.confirm({
        message: "This folder has a Lume site with Deno. Do you want help to migrate to Node?",
      }))
    ) {
      return migrateToNode();
    }

    const res = await prompts.select({
      message:
        (root === cwd ? "Current directory" : `Target directory "${targetDir}"`) +
        ` is not empty. Please choose how to proceed:`,
      options: [
        {
          label: "Cancel",
          value: "cancel",
        },
        {
          label: "Remove existing files and continue",
          value: "empty",
        },
        {
          label: "Ignore files and continue",
          value: "ignore",
        },
      ],
    });

    if (prompts.isCancel(res)) return cancel();

    switch (res) {
      case "empty":
        emptyDir(targetDir);
        break;
      case "cancel":
        return cancel();
    }
  }

  // 3. Create project directory and basic files
  fs.mkdirSync(root, { recursive: true });

  createNodeFiles(root, targetDir.replaceAll(/[^\w-]/g, ""));

  writeFile(root, "tsconfig.json", {
    compilerOptions: {
      moduleResolution: "NodeNext",
      module: "NodeNext",
      jsx: "react-jsx",
      jsxImportSource: "@lumeland/ssx",
      allowImportingTsExtensions: true,
      rewriteRelativeImportExtensions: true,
      erasableSyntaxOnly: true,
    },
  });

  writeFile(root, ".gitignore", ["_site", "_cache", "node_modules", ".env", ".DS_Store"]);

  const src = options.src ? path.join("/", options.src).replace(/^\//, "") : "";
  const srcRoot = path.join(root, src);
  if (srcRoot !== root) {
    fs.mkdirSync(srcRoot);
  }

  const config = options.js ? "_config.js" : "_config.ts";

  // 4. Install Lume + theme or only Lume
  if (options.theme) {
    await installTheme(options.theme);
  } else {
    const packages = ["@lumeland/lume", "@lumeland/ssx"];

    // 4.1. Select plugins
    const selectedPlugins = await prompts.autocompleteMultiselect({
      message: "Plugins to install",
      options: Object.entries(plugins).map(([key, [name]]) => ({
        label: name,
        value: key,
        hint: `https://lume.land/plugins/${key}/`,
      })),
      maxItems: Infinity,
    });

    const keys = !prompts.isCancel(selectedPlugins) ? selectedPlugins : [];
    const imports: ConfigImport[] = keys.map((name) => {
      const [key, init] = plugins[name];
      const specifier = `@lumeland/plugin-${key}`;
      return { name, specifier, init: init ?? "" };
    });

    packages.push(...imports.map(({ specifier }) => specifier));

    // 4.2. Setup LumeCMS
    if (await prompts.confirm({ message: "Do you want to setup Lume CMS?" })) {
      packages.push("@lumeland/cms", "@lumeland/plugin-cms");
      imports.push({
        name: "lumeCms",
        specifier: "@lumeland/plugin-cms",
        init: "{ cms }",
      });
      const cmsConfig = options.js ? "_cms.js" : "_cms.ts";
      imports.push({
        name: "cms",
        specifier: `./${cmsConfig}`,
        init: false,
      });
      writeFile(root, cmsConfig, [
        'import create from "@lumeland/cms";',
        "",
        "const cms = create();",
        "",
        "export default cms;",
      ]);
    }

    // 4.3. Install everything and create the remaining files
    run(pkgManager, installArgs("@lumeland/lume", ...packages), root);
    writeFile(root, config, getConfigCode(imports));

    writeFile(srcRoot, "index.md", [
      "# Hello world",
      "[Go to Lume documentation](https://lume.land)",
    ]);
  }

  // Success
  let doneMessage = `🔥 Done! Now run ${styleText(["greenBright"], runCommand())} to get started!`;
  prompts.outro(doneMessage);

  /** Get the install arguments according the package manager */
  function installArgs(...pkgs: string[]) {
    switch (pkgManager) {
      case "yarn":
      case "pnpm":
      case "bun":
        return ["add", ...pkgs];
      default:
        return ["install", ...pkgs];
    }
  }

  /** Get the run script arguments according the package manager */
  function scriptArgs(...script: string[]) {
    switch (pkgManager) {
      case "yarn":
      case "pnpm":
      case "bun":
        return script;
      default:
        return ["run", ...script];
    }
  }

  async function installTheme(source: string) {
    const name = source.startsWith(".") ? realpathSync(source) : source;
    run(pkgManager, installArgs("@lumeland/lume", "@lumeland/ssx", name), root);

    const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf-8"));
    const specifier = Object.keys(pkg.dependencies).find(
      (name) => name !== "@lumeland/lume" && name !== "@lumeland/ssx",
    );

    if (!specifier) {
      throw new Error(`Theme ${source} not installed`);
    }

    writeFile(root, config, getConfigCode([{ name: "theme", specifier, init: "" }]));
    writeFile(root, "__setup__.js", [
      `import site from "./${config}"`,
      `import * as theme from "${specifier}"`,
      "if (theme.setup) {",
      "site.archetype('__setup__', theme.setup);",
      "site.archetypes.run('__setup__');",
      "} else {",
      `console.log('No setup script found for ${specifier}')`,
      "}",
    ]);
    run("node", ["./__setup__.js"], root);
    fs.rmSync(path.join(root, "__setup__.js"));
  }

  interface ConfigImport {
    name: string;
    specifier: string;
    init: string | false;
  }

  function getConfigCode(imports: ConfigImport[] = []) {
    const code: string[] = ['import lume from "@lumeland/lume";'];

    for (const { name, specifier } of imports) {
      code.push(`import ${name} from "${specifier}";`);
    }

    code.push("");

    if (src) {
      code.push("const site = lume({", `  src: "${src}"`, "});");
    } else {
      code.push("const site = lume();");
    }

    for (const { name, init } of imports) {
      if (init === false) {
        continue;
      }

      code.push(`site.use(${name}(${init}));`);
    }

    code.push("", "export default site;", "");

    return code;
  }

  function migrateToNode() {
    createNodeFiles(root, path.basename(root).replaceAll(/[^\w-]/g, ""));
    const denoConfig = JSON.parse(fs.readFileSync(path.join(root, "deno.json"), "utf-8"));
    const lumeConfigPath = fs.existsSync(path.join(root, "_config.ts"))
      ? "_config.ts"
      : "_config.js";
    let lumeConfig = fs.readFileSync(path.join(root, lumeConfigPath), "utf-8");
    const packages = ["@lumeland/lume", "@lumeland/ssx"];

    for (const spec of Object.values(denoConfig.imports as Record<string, string>)) {
      if (spec.startsWith("npm:")) {
        packages.push(spec.slice(4));
      }
    }

    lumeConfig = lumeConfig.replaceAll(/from ["']([^"']+)["']/g, (full, spec) => {
      if (spec === "lume/mod.ts") {
        return 'from "@lumeland/lume"';
      }

      if (spec.startsWith("lume/core/")) {
        if (!packages.includes("@lumeland/core")) {
          packages.push("@lumeland/core");
        }
        return `from "@lumeland/core/${spec.slice(10)}"`;
      }

      if (spec.startsWith("lume/plugins/")) {
        const name = spec.slice(13, -3).replaceAll("_", "-");

        if (Object.values(plugins).find(([n]) => n === name)) {
          const fullName = `@lumeland/plugin-${name}`;
          packages.push(fullName);
          return `from "${fullName}"`;
        } else {
          console.warn(`Plugin ${name} not found`);
        }
      }

      if (spec.startsWith("npm:")) {
        const match = spec.match(/^npm:(@?[^@]+)(@[^/]+)?(.*)$/);

        if (match) {
          const [, name, version = "", path = ""] = match;
          packages.push(`${name}${version}`);
          return `from "${name}${path}"`;
        } else {
          console.log(`Invalid npm package: ${spec}`);
        }
      }

      return full;
    });

    writeFile(root, lumeConfigPath, lumeConfig);
    run(pkgManager, installArgs(...packages), root);

    let doneMessage = `Automatic migration to Node completed 🔥🔥🔥\n`;
    doneMessage += "   Note that you may need additional changes:\n";
    doneMessage += `   - Run ${styleText(["greenBright"], runCommand())} to check if the site builds\n`;
    doneMessage += `   - Add ${styleText(["dim"], "node_modules")} to .gitignore\n`;
    doneMessage += `   - Remove the deno.json file`;

    prompts.outro(doneMessage);
    process.exit(0);
  }

  function runCommand() {
    let command = "";
    if (root !== cwd) {
      const cdProjectName = path.relative(cwd, root);
      command += `cd ${cdProjectName.includes(" ") ? `"${cdProjectName}"` : cdProjectName} && `;
    }
    command += `${pkgManager} ${scriptArgs("serve").join(" ")}`;
    return command;
  }
}

function getPackageManager(userArg?: string): PkgManager {
  if (userArg) {
    if (pkgManagers.includes(userArg as PkgManager)) {
      return userArg as PkgManager;
    }

    throw new Error(
      `Invalid package manager: ${userArg}. Available versions: ${pkgManagers.join(", ")}`,
    );
  }
  const ua = process.env.npm_config_user_agent?.split(" ")[0];
  if (!ua) {
    return "npm";
  }
  const pkg = ua.split("/")[0] as PkgManager;
  if (pkgManagers.includes(pkg)) {
    return pkg;
  }
  return "npm";
}

function formatTargetDir(targetDir: string) {
  return targetDir.trim().replaceAll(/\s/g, "-").replace(/\/+$/g, "");
}

function isEmpty(path: string) {
  const files = fs.readdirSync(path);
  return files.length === 0 || (files.length === 1 && files[0] === ".git");
}

function emptyDir(dir: string) {
  if (!fs.existsSync(dir)) {
    return;
  }

  for (const file of fs.readdirSync(dir)) {
    if (file === ".git") {
      continue;
    }
    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true });
  }
}

function writeFile(
  dir: string,
  name: string,
  content: string | Record<string, unknown> | string[],
) {
  const filename = path.join(dir, name);

  if (Array.isArray(content)) {
    content = content.join("\n") + "\n";
  } else if (typeof content !== "string") {
    content = JSON.stringify(content, null, 2);
  }

  fs.writeFileSync(filename, content);
}

/** Run an command and return if it's success */
function run(cmd: string, args: string[] = [], cwd?: string): boolean {
  const child = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
  });

  return child.status === 0;
}

function createNodeFiles(root: string, name?: string) {
  writeFile(root, "package.json", {
    name: name || "lume-site",
    private: true,
    type: "module",
    allowScripts: {
      esbuild: false,
      fsevents: false,
      "@parcel/watcher": false,
    },
    scripts: {
      serve: "lume build -s",
      build: "lume build",
    },
  });

  writeFile(root, "tsconfig.json", {
    compilerOptions: {
      moduleResolution: "NodeNext",
      module: "NodeNext",
      jsx: "react-jsx",
      jsxImportSource: "@lumeland/ssx",
      allowImportingTsExtensions: true,
      rewriteRelativeImportExtensions: true,
      erasableSyntaxOnly: true,
    },
  });
}

function isDenoProject(root: string) {
  return (
    fs.existsSync(path.join(root, "deno.json")) &&
    (fs.existsSync(path.join(root, "_config.ts")) || fs.existsSync(path.join(root, "_config.js")))
  );
}

const cli = cac("create-lume");
cli.option("--js", "Use JavaScript (_config.js) instead of TypeScript (_config.ts)");
cli.option("--src <src>", "The source directory");
cli.option("--theme <package>", "Installable package with a Lume theme");
cli.option(
  "--pkg-manager <name>",
  "To use a specific package manager. Allowed options: " + pkgManagers.join(", "),
);
cli.help();

const parsed = cli.parse();

if (!parsed.options.help) {
  init(parsed.args[0], parsed.options);
}
