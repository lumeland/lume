export const title = "liquid filter example";

export default function (data, { liquid }) {
  const content = `<h1>{{ title | upcase }}</h1>`;
  return liquid(content, data);
}
