import { concurrent } from "./utils.ts";
import { Exception } from "./errors.ts";

import type { Resource } from "../core.ts";

/**
 * Class to store and run the (pre)processors
 */
export default class Processors {
  /** Processors and the assigned extensions */
  processors = new Map<Processor, string[] | "*">();

  /** Assign a processor to some extensions */
  set(extensions: string[] | "*", processor: Processor) {
    if (Array.isArray(extensions)) {
      extensions.forEach((extension) => {
        if (extension.charAt(0) !== ".") {
          throw new Exception(
            "Invalid extension. It must start with '.'",
            { extension },
          );
        }
      });
    }

    this.processors.set(processor, extensions);
  }

  /** Apply the processors to the provided pages */
  async run(resources: Resource[]): Promise<void> {
    for (const [process, exts] of this.processors) {
      await concurrent(
        resources,
        async (page) => {
          try {
            if (
              (exts === "*" || (page.src.ext && exts.includes(page.src.ext)) ||
                exts.includes(page.dest.ext))
            ) {
              await process(page);
            }
          } catch (cause) {
            throw new Exception("Error processing page", {
              cause,
              page,
              processor: process.name,
            });
          }
        },
      );
    }
  }
}

/** A (pre)processor */
export type Processor = (resource: Resource) => void;
