#!/usr/bin/env node

import { startProcess } from "@lumeland/core/services/hmr.ts";
import { fileURLToPath } from "node:url";

// main entry can be cli.ts or cli.js
const mainEntry = fileURLToPath(import.meta.url.replace(/bin(\.\w+)$/, "cli$1"));
const tsxEntry = import.meta.resolve("tsx");

startProcess(mainEntry, tsxEntry);
