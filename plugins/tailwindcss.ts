import { getBinary } from "../deps/tailwindcss.ts";
import { merge } from "../core/utils/object.ts";
import { log } from "../core/utils/log.ts";
import { dirname } from "../deps/path.ts";

import type Site from "../core/site.ts";

export interface Options {
  /** Extensions processed by this plugin */
  extensions?: string[];

  /** Optimization level of the CSS code */
  optimize?: false | "optimize" | "minify";
}

export const defaults: Options = {
  extensions: [".css"],
  optimize: "minify",
};

/**
 * A plugin to extract the utility classes from HTML pages and apply TailwindCSS
 * @see https://lume.land/plugins/tailwindcss/
 */
export function tailwindCSS(userOptions?: Options) {
  return (site: Site) => {
    const options = merge(defaults, userOptions);

    site.loadAssets(options.extensions);
    const cache = site.root("_cache/tailwindcss");
    let binary: string;

    const args = [
      "--input=-",
    ];

    if (options.optimize === "optimize") {
      args.push("--optimize");
    } else if (options.optimize === "minify") {
      args.push("--minify");
    }

    log.info(`Running TailwindCSS with args <gray>${args.join(" ")}</gray>`);

    site.process(options.extensions, async (pages) => {
      if (!binary) {
        binary = await getBinary(cache);
      }

      for (const page of pages) {
        const command = new Deno.Command(binary, {
          stdin: "piped",
          stdout: "piped",
          stderr: "piped",
          args,
          cwd: site.src(dirname(page.src.path)),
        });
        const process = command.spawn();
        const stdin = process.stdin;
        const content = new TextEncoder().encode(page.content as string);
        const writter = stdin.getWriter();
        writter.write(content);
        writter.close();
        const { stdout, stderr, success } = await process.output();

        if (!success) {
          log.info(
            `Error running TailwindCSS on <cyan>${page.outputPath}</cyan>: <red>${
              new TextDecoder().decode(stderr)
            }</red>`,
          );
        }

        page.content = new TextDecoder().decode(stdout);
      }
    });
  };
}

export default tailwindCSS;
