import { getBinary } from "../deps/tailwindcss.ts";
import { merge } from "../core/utils/object.ts";
import { log } from "../core/utils/log.ts";
import { dirname } from "../deps/path.ts";

import type Site from "../core/site.ts";

export interface Options {
  /** Optimization level of the CSS code */
  optimize?: false | "optimize" | "minify";
}

export const defaults: Options = {
  optimize: "minify",
};

/**
 * A plugin to extract the utility classes from HTML pages and apply TailwindCSS
 * @see https://lume.land/plugins/tailwindcss/
 */
export function tailwindCSS(userOptions?: Options) {
  return (site: Site) => {
    const options = merge(defaults, userOptions);

    const cache = site.root("_cache/tailwindcss");
    let binaryPath: string;

    const args = [
      "--input=-",
    ];

    if (options.optimize === "optimize") {
      args.push("--optimize");
    } else if (options.optimize === "minify") {
      args.push("--minify");
    }

    log.info(`Running TailwindCSS with args <gray>${args.join(" ")}</gray>`);

    site.process([".css"], async (files) => {
      if (files.length === 0) {
        log.info(
          "[tailwindcss plugin] No CSS files found. Make sure to add the CSS files with <gray>site.add()</gray>",
        );
        return;
      }

      if (!binaryPath) {
        binaryPath = await getBinary(cache);
      }

      for (const file of files) {
        const command = new Deno.Command(binaryPath, {
          stdin: "piped",
          stdout: "piped",
          stderr: "piped",
          args,
          cwd: site.src(dirname(file.src.path)),
        });
        const process = command.spawn();
        const stdin = process.stdin;
        const writter = stdin.getWriter();
        writter.write(file.bytes);
        writter.close();
        const { stdout, stderr, success } = await process.output();

        if (!success) {
          log.info(
            `Error running TailwindCSS on <cyan>${file.outputPath}</cyan>: <red>${
              new TextDecoder().decode(stderr)
            }</red>`,
          );
        }

        file.content = stdout;
      }
    });
  };
}

export default tailwindCSS;
