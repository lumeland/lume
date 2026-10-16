#!/usr/bin/env node

import process from "node:process";
import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import * as prompts from "@clack/prompts";
import cac from "cac";

const cli = cac("create-lume");
cli.option("--js", "Use JavaScript (_config.js) instead of TypeScript (_config.ts)");
cli.option("--src <src>", "The source directory");
cli.help();

const parsed = cli.parse();
const pkgManager = getPackageManager();

init(parsed.args[0], parsed.options);

interface InitOptions {
  js?: boolean;
  src?: string;
}

async function init(targetDir: string | undefined, options: InitOptions) {
  const cwd = process.cwd();
  const cancel = () => prompts.cancel("Operation cancelled");

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

  // Create project directory
  fs.mkdirSync(root, { recursive: true });

  // Create the _config file
  const code: string[] = ['import lume from "@lumeland/lume";', ""];

  const src = options.src ? path.join("/", options.src).replace(/^\//, "") : "";
  if (src) {
    code.push("const site = lume({", `  src: "${src}"`, "});");
  } else {
    code.push("const site = lume()");
  }

  code.push("", "export default site;");
  writeFile(root, options.js ? "_config.js" : "_config.ts", code);

  // Create the remaining files
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
      jsx: "react-jsx",
      jsxImportSource: "@lumeland/ssx",
    },
  });

  writeFile(root, ".gitignore", ["_site", "_cache", "node_modules", ".env", ".DS_Store"]);
  const srcRoot = path.join(root, src);
  if (srcRoot !== root) {
    fs.mkdirSync(srcRoot);
  }
  writeFile(srcRoot, "index.md", [
    "# Hello world",
    "[Go to Lume documentation](https://lume.land)",
  ]);

  // Install @lumeland/lume
  switch (pkgManager) {
    case "yarn":
    case "pnpm":
    case "bun":
      run(pkgManager, ["add", "@lumeland/lume"], root);
      break;
    default:
      run("npm", ["install", "@lumeland/lume"], root);
  }

  // Success
  let doneMessage = "";
  const cdProjectName = path.relative(cwd, root);
  doneMessage += `Done. Now run:\n`;
  if (root !== cwd) {
    doneMessage += `\n  cd ${cdProjectName.includes(" ") ? `"${cdProjectName}"` : cdProjectName}`;
  }
  switch (pkgManager) {
    case "yarn":
    case "pnpm":
    case "bun":
      doneMessage += `\n  ${pkgManager} serve`;
    default:
      doneMessage += `\n  npm run serve`;
  }

  prompts.outro(doneMessage);
}

function getPackageManager(): string {
  const ua = process.env.npm_config_user_agent?.split(" ")[0];
  if (!ua) {
    return "npm";
  }
  return ua.split("/")[0];
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
  const child = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
  });

  return child.status === 0;
}
