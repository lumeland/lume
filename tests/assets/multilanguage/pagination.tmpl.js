export const lang = ["gl", "en"];
export const layout = "layout.njk";

export default function* ({ search, paginate, mergeLanguages }) {
  const gl = paginate(search.pages("lang=gl", "url=asc"));
  const en = paginate(search.pages("lang=en", "url=asc"));

  yield* mergeLanguages({ gl, en });
}
