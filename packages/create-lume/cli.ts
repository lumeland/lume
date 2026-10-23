#!/usr/bin/env node

import process from "node:process";
import path from "node:path";
import fs, { realpathSync } from "node:fs";
import { spawnSync } from "node:child_process";
import * as prompts from "@clack/prompts";
import cac from "cac";

const cli = cac("create-lume");
cli.option("--js", "Use JavaScript (_config.js) instead of TypeScript (_config.ts)");
cli.option("--src <src>", "The source directory");
cli.option("--theme <package>", "Installable package with a Lume theme");
cli.help();

const parsed = cli.parse();

init(parsed.args[0], parsed.options);

const pkgManagers = ["npm", "yarn", "pnpm", "bun"] as const;
type PkgManager = (typeof pkgManagers)[number];

const plugins = [
  "base-path",
  "check-urls",
  "code-highlight",
  "compress",
  "date",
  "decap-cms",
  "epub",
  "esbuild",
  "eta",
  "extract-date",
  "extract-order",
  "favicon",
  "feed",
  "filter-pages",
  "git-date",
  "git-info",
  "google-fonts",
  "icons",
  "image-size",
  "inline",
  "json-ld",
  "jsx",
  "katex",
  "lightningcss",
  "mdx",
  "metas",
  "minify-html",
  "modify-urls",
  "multilanguage",
  "nav",
  "nunjucks",
  "og-images",
  "pagefind",
  "partytown",
  "picture",
  "plaintext",
  "postcss",
  "prism",
  "pug",
  "purgecss",
  "pwa",
  "reading-info",
  "redirects",
  "relative-urls",
  "remark",
  "replace",
  "resolve-urls",
  "robots",
  "sass",
  "search",
  "sheets",
  "sitemap",
  "slugify-urls",
  "source-maps",
  "sri",
  "svgo",
  "tailwindcss",
  "terser",
  "toc",
  "toml",
  "transform-images",
  "unocss",
  "validate-html",
  "well-known",
];

interface InitOptions {
  js?: boolean;
  src?: string;
  theme?: string;
}

async function init(targetDir: string | undefined, options: InitOptions) {
  const cwd = process.cwd();
  const cancel = () => prompts.cancel("Operation cancelled");
  let pkgManager = getPackageManager();

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

  writeFile(root, "package.json", {
    name: targetDir.replaceAll(/[^\w-]/g, "") || "lume-site",
    private: true,
    type: "module",
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

  writeFile(root, ".gitignore", ["_site", "_cache", "node_modules", ".env", ".DS_Store"]);

  const src = options.src ? path.join("/", options.src).replace(/^\//, "") : "";
  const srcRoot = path.join(root, src);
  if (srcRoot !== root) {
    fs.mkdirSync(srcRoot);
  }

  // 4. Install Lume
  run(pkgManager, installArgs("@lumeland/lume"), root);

  const config = options.js ? "_config.js" : "_config.ts";

  // 5. Install a theme or an empty site
  if (options.theme) {
    await installTheme(options.theme);
  } else {
    const selectedPlugins = await prompts.autocompleteMultiselect({
      message: "Plugins to install",
      options: plugins.map((name) => ({
        label: name,
        value: name,
        hint: `https://lume.land/plugins/${name}/`,
      })),
      maxItems: Infinity,
    });

    const p = !prompts.isCancel(selectedPlugins) ? selectedPlugins : [];

    if (p.length) {
      run(pkgManager, installArgs(...p.map((n) => `@lumeland/plugin-${n}`)), root);
    }

    writeFile(
      root,
      config,
      getConfigCode(Object.fromEntries(p.map((n) => [toCamelCase(n), `@lumeland/plugin-${n}`]))),
    );

    writeFile(srcRoot, "index.md", [
      "# Hello world",
      "[Go to Lume documentation](https://lume.land)",
    ]);
  }

  // Success
  let doneMessage = `Done. Now run:\n`;
  if (root !== cwd) {
    const cdProjectName = path.relative(cwd, root);
    doneMessage += `\n  cd ${cdProjectName.includes(" ") ? `"${cdProjectName}"` : cdProjectName}`;
  }
  doneMessage += `\n  ${pkgManager} ${scriptArgs("serve").join(" ")}`;
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
    const theme = source.startsWith(".") ? realpathSync(source) : source;
    run(pkgManager, installArgs(theme), root);

    const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf-8"));
    const specifier = Object.keys(pkg.dependencies).find((name) => name !== "@lumeland/lume");

    if (!specifier) {
      throw new Error(`Theme ${source} not installed`);
    }

    writeFile(root, config, getConfigCode({ theme: specifier }));
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

  function getConfigCode(plugins: Record<string, string> = {}) {
    const code: string[] = ['import lume from "@lumeland/lume";'];

    for (const [name, specifier] of Object.entries(plugins)) {
      code.push(`import ${name} from "${specifier}";`);
    }

    code.push("");

    if (src) {
      code.push("const site = lume({", `  src: "${src}"`, "});");
    } else {
      code.push("const site = lume();");
    }

    for (const name of Object.keys(plugins)) {
      code.push(`site.use(${name}());`);
    }

    code.push("", "export default site;", "");

    return code;
  }
}

function getPackageManager(): PkgManager {
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

function toCamelCase(name: string): string {
  return name
    .split("-")
    .map((part, index) => {
      if (!index) return part;
      return part[0].toUpperCase() + part.slice(1);
    })
    .join("");
}

/** Run an command and return if it's success */
export function run(cmd: string, args: string[] = [], cwd?: string): boolean {
  const child = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
  });

  return child.status === 0;
}
