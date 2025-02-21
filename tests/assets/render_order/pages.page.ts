export const url = "/articles/";
export default function* () {
  const pages = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  for (const page of pages) {
    yield {
      content: page,
      basename: page,
    };
  }
}
