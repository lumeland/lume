import yamlLoader from "../core/loaders/yaml.ts";
import { merge } from "../core/utils/object.ts";

import type Site from "../core/site.ts";
import { Data } from "../core/file.ts";

export interface Options {
  /** File extensions to load */
  extensions?: string[];

  /** Optional sub-extension for page files */
  pageSubExtension?: string;
}

// Default options
export const defaults = {
  extensions: [".yaml", ".yml"],
} satisfies Options;

/**
 * A plugin to load YAML data files and pages
 * Installed by default
 * @see https://lume.land/plugins/yaml/
 */
export function yaml(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return <D extends Data>(site: Site<D>) => {
    site.loadData(options.extensions, yamlLoader);
    site.loadPages(options.extensions, {
      loader: yamlLoader,
      pageSubExtension: options.pageSubExtension,
    });
  };
}

export default yaml;
