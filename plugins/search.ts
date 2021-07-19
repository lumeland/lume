import { Site } from "../core.ts";
import Search from "../core/helpers/search.ts";
import paginate from "../core/helpers/paginate.ts";

/** A plugin to enable the "search" and "paginate" helpers */
export default function () {
  return (site: Site) => {
    const ext = site.options.prettyUrls ? "/index.html" : ".html";
    const defaults = {
      size: 10,
      url: (page: number) => `./page-${page}${ext}`,
    };

    site.data("paginate", paginate(defaults));
    site.data("search", new Search(site));
  };
}
