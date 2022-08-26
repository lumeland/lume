export const lang = ["gl", "en"];
export const layout = "layout.njk";

export default function* ({ search, paginate, mergeLanguages }) {
  const gl = paginate(search.pages("lang=gl"));
  const en = paginate(search.pages("lang=en"));

  yield* mergeLanguages({ gl, en });
}
