#!/usr/bin/env node
import { type ChildProcess, fork } from "node:child_process";
import { fileURLToPath } from "node:url";
import process from "node:process";

const mainEntry = fileURLToPath(import.meta.resolve("./cli.ts"));
const tsxEntry = import.meta.resolve("tsx");

let child: ChildProcess | undefined;

function start() {
  child = fork(mainEntry, process.argv.slice(2), {
    stdio: ["inherit", "inherit", "inherit", "ipc"],
    execArgv: [...process.execArgv, "--import", tsxEntry],
  });

  let relaunch = false;

  child.on("message", (msg) => {
    if ((msg as { type?: string }).type === "reload") {
      relaunch = true;
      child?.kill("SIGTERM");
    }
  });

  child.on("exit", (code, signal) => {
    if (relaunch) return start();
    process.exit(code ?? (signal ? 1 : 0));
  });
}

start();
