export { default as hljs } from "highlight.js";
export type { HLJSOptions, LanguageFn } from "highlight.js";

export function themePath(name: string) {
  return import.meta.resolve(`highlight.js/styles/${name}.min.css`);
}
