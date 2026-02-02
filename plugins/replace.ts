import { merge } from "../core/utils/object.ts";
import type { Extensions } from "../core/utils/path.ts";
import type Site from "../core/site.ts";

export interface Options {
  extensions?: Extensions;
  replacements: Record<string, string | ((text: string) => string)>;
}

export const defaults: Options = {
  extensions: [".html"],
  replacements: {},
};

export default function replace(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.process(options.extensions, (pages) => {
      const entries = Object.entries(options.replacements);

      for (const page of pages) {
        let content = page.text;

        for (const [searchValue, replaceValue] of entries) {
          // @ts-expect-error: replaceValue can be a function
          content = content.replaceAll(searchValue, replaceValue);
        }

        page.text = content;
      }
    });
  };
}

export { replace };
