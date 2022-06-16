export const renderOrder = 2;

export default function* () {
  const pages = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

  for (const page of pages) {
    yield {
      content: page,
      url: `/articles/${page}/`,
    };
  }
}
