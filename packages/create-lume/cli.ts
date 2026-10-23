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
cli.option("--pkg-manager <packageManager>", "Package manager used (npm, yarn or pnpm)");
cli.help();

const parsed = cli.parse();

init(parsed.args[0], parsed.options);

const pkgManagers = ["npm", "yarn", "pnpm", "bun"] as const;
type PkgManager = (typeof pkgManagers)[number];

interface InitOptions {
  js?: boolean;
  src?: string;
  theme?: string;
  pkgManager?: PkgManager;
}

async function init(targetDir: string | undefined, options: InitOptions) {
  const cwd = process.cwd();
  const cancel = () => prompts.cancel("Operation cancelled");
  let pkgManager = getPackageManager();
  if (options.pkgManager) {
    if (!pkgManagers.includes(options.pkgManager)) {
      console.error(`Invalid package manager (${options.pkgManager}). Use "npm", "yarn" or "pnpm"`);
      process.exit(1);
    }
    pkgManager = options.pkgManager;
  }

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
    writeFile(root, config, getConfigCode());

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
  function installArgs(pkg: string) {
    switch (pkgManager) {
      case "yarn":
      case "pnpm":
      case "bun":
        return ["add", pkg];
      default:
        return ["install", pkg];
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

  async function installTheme(specifier: string) {
    const theme = specifier.startsWith(".") ? realpathSync(specifier) : specifier;
    run(pkgManager, installArgs(theme), root);

    const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf-8"));
    const themeName = Object.keys(pkg.dependencies).find((name) => name !== "@lumeland/lume");

    writeFile(root, config, getConfigCode(themeName));
    writeFile(root, "__setup__.js", [
      `import site from "./${config}"`,
      `import * as theme from "${themeName}"`,
      "if (theme.setup) {",
      "site.archetype('__setup__', theme.setup);",
      "site.archetypes.run('__setup__');",
      "} else {",
      `console.log('No setup script found for ${themeName}')`,
      "}",
    ]);
    run("node", ["./__setup__.js"], root);
    fs.rmSync(path.join(root, "__setup__.js"));
  }

  function getConfigCode(theme?: string) {
    const code: string[] = ['import lume from "@lumeland/lume";'];

    if (theme) {
      code.push(`import theme from "${theme}";`);
    }

    code.push("");

    if (src) {
      code.push("const site = lume({", `  src: "${src}"`, "});");
    } else {
      code.push("const site = lume();");
    }

    if (theme) {
      code.push("site.use(theme());");
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

/** Run an command and return if it's success */
export function run(cmd: string, args: string[] = [], cwd?: string): boolean {
  console.log({ cmd, args, cwd });
  const child = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
  });

  return child.status === 0;
}
