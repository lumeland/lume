import { open } from "node:inspector";
import { log } from "../core/utils/log.ts";

export function openInspector() {
  open(9229, "127.0.0.1");
  console.log();
  log.info("Visit <code>chrome://inspect</code> in a Chromium based browser");
  log.info("Click on <cyan>Open dedicated DevTools for Node</cyan> link");
  log.info(
    "Your code will appear in <cyan>Sources > Deployed > worker [1]</cyan>",
  );
  console.log();
  alert("Press enter to continue.");
}
