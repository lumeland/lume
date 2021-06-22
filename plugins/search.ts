import Search from "../helpers/search.ts";
import paginate from "../helpers/paginate.ts";

export default function () {
  return (site) => {
    site.data("paginate", paginate(site));

    const search = new Search(site);
    site.data("search", search);
  };
}
