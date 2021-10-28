export const layout = "layout.jsx";

// Export a function
export default function* () {
  const pages = [1, 2];

  for (const page of pages) {
    yield {
      url: `/page/${page}`,
      content: <div>{page}</div>,
    };
  }
}
