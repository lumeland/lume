export const title = "vento filter example";

export default function (data, { vto }) {
  const content = `<h1>{{ title |> toUpperCase }}</h1>`;
  return vto(content, data);
}
