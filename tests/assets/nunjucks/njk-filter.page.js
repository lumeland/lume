export const title = "njk filter example";

export default function (data, { njk }) {
  const content = `<h1>{{ title | upper }}</h1>`;
  return njk(content, data);
}
