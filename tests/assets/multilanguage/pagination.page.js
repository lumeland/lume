export const layout = "layout.njk";

export default function* ({ search, paginate }) {
  for (const p of paginate(search.pages("lang=gl", "url=asc"))) {
    yield {
      ...p,
      lang: "gl",
      id: `page-${p.pagination.page}`,
    };
  }
  for (const p of paginate(search.pages("lang=en", "url=asc"))) {
    yield {
      ...p,
      lang: "en",
      id: `page-${p.pagination.page}`,
    };
  }
}
