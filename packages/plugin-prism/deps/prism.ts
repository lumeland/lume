export { default as Prism } from "prismjs";
import "prismjs/plugins/autoloader/prism-autoloader.js";

export function themePath(name: string) {
  if (name === "default" || name === "prism") {
    return import.meta.resolve(`prismjs/themes/prism.min.css`);
  }

  return import.meta.resolve(`prismjs/themes/prism-${name}.min.css`);
}
