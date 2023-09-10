import type { PageData } from "../../../core.ts";

export const layout = "paginate.js";
export const renderOrder = 1;

export default function* ({ search, paginate }: PageData) {
  const result = search.pages();
  const pages = paginate(result, {
    size: 5,
  });

  yield* pages;
}
