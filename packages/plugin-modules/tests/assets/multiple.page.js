export const tags = ["multiple"];
export const layout = "layout.js";

export default function* () {
  const pages = [1, 2, 3];

  for (const page of pages) {
    const content = {
      url: `/multiple/${page}.html`,
      content: `Content page ${page}`,
    };

    // The first page has a custom title
    if (page === 1) {
      content.title = "Page 1";
    }

    yield content;
  }
}
