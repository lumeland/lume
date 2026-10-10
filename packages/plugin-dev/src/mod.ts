import { SiteWatcher } from "@lumeland/core/watcher.ts";
import reload from "./reload.ts";
import noCache from "./no_cache.ts";
import noCors from "./no_cors.ts";

import type Site from "@lumeland/core/site.ts";

/**
 * A plugin to add some middlewares useful for development
 */
export function dev() {
  return (site: Site) => {
    const server = site.getServer();

    server.useFirst(
      reload({
        watcher: new SiteWatcher(site),
        basepath: site.options.location.pathname,
        debugBar: site.debugBar,
        server,
      }),
      noCache(),
      noCors(),
    );
  };
}

export default dev;
