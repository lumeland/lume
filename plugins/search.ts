import Search from "../helpers/search.ts";
import paginate from "../helpers/paginate.ts";
import Site from "../site.ts";

export default function () {
  return (site: Site) => {
    site.data("paginate", paginate(site));

    const search = new Search(site);
    site.data("search", search);
  };
}
