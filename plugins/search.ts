import Search from "../helpers/search.js";
import paginate from "../helpers/paginate.js";

export default function () {
  return (site) => {
    site.data("paginate", paginate(site));

    const search = new Search(site);
    site.data("search", search);
  };
}
