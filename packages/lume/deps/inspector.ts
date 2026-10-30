import { open } from "node:inspector";

export function openInspector() {
  open(9229, "127.0.0.1", true);
}
