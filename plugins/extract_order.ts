import type Site from "../core/site.ts";
import { merge } from "../core/utils/object.ts";

export interface Options {
  /** Remove the order from the path */
  remove?: boolean;

  /** Set true to aggregate the order in cascade */
  cascade?: boolean;
}

export const defaults: Options = {
  remove: true,
  cascade: false,
};

const ORDER_REGEX = /(\d+)\.(.+)/;

/**
 * A plugin to extract the order from the files and folders paths
 * @see https://lume.land/plugins/extract_order/
 */
export function extractOrder(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.parseBasename((name, parent) => {
      const match = name.match(ORDER_REGEX);

      if (match) {
        let [, order, basename] = match;

        if (options.cascade) {
          order = `${parent.order ?? ""}${order.padStart(2, "0")}`;
        }

        if (!options.remove) {
          basename = name;
        }

        return { order, basename };
      }
    });
  };
}

export default extractOrder;
