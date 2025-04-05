import { assert } from "../../../deps/assert.ts";
export const layout = "layout.jsx";

// Export a function
export default function* ({ url }) {
  const pages = [1, 2];

  assert(url === "/multiple/");

  for (const page of pages) {
    yield {
      url: `/page/${page}/`,
      content: <div>{page}</div>,
    };
  }
}
