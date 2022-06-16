import { Paginator } from "../../../plugins/paginate.ts";
import { Search } from "../../../plugins/search.ts";

export const layout = "paginate.tmpl.js";

export default function* (
  { search, paginate }: { search: Search; paginate: Paginator },
) {
  const result = search.pages();
  const pages = paginate(result, {
    size: 5,
  });

  yield* pages;
}
