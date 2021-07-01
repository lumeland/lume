import Site from "../site.ts";
import Search from "../helpers/search.ts";
import paginate from "../helpers/paginate.ts";

/**
 * This plugin enable search and paginate helpers
 */
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
