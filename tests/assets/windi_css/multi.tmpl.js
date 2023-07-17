export default function* () {
  yield {
    url: `/page/1.html`,
    layout: "layout.njk",
    content: () => {
      return '<p class="text-sky-100">This is page 1</p>';
    },
  };
  yield {
    url: `/page/2.html`,
    layout: "layout.njk",
    content: () => {
      return '<p class="text-sky-200">This is page 2</p>';
    },
  };
}
