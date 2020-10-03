import Search from "../helpers/search.js";
import paginate from "../helpers/paginate.js";

export default function () {
  return (site) => {
    site.helper("paginate", paginate);

    const search = new Search(site);
    site.helper("search", search);
    site.addEventListener("beforeBuild", () => search.refresh());
  };
}
