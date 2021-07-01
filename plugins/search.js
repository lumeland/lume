import Search from "../helpers/search.ts";
import paginate from "../helpers/paginate.ts";

export default function () {
  return (site) => {
    const ext = site.options.prettyUrls ? "/index.html" : ".html";
    const defaults = {
      size: 10,
      url: (page) => `./page-${page}${ext}`,
    };

    site.data("paginate", paginate(defaults));

    const search = new Search(site);
    site.data("search", search);
  };
}
