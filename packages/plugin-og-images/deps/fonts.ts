const baseUrl = "https://cdn.jsdelivr.net/npm/@xz/fonts@1.0.2/serve/src";

export interface Font {
  name: string;
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  style: "normal" | "italic";
  url: string;
}

export const fonts: Font[] = [
  {
    name: "inter",
    weight: 400,
    style: "normal",
    url: `${baseUrl}/inter/Inter-Regular.woff`,
  },
  {
    name: "inter",
    weight: 700,
    style: "normal",
    url: `${baseUrl}/inter/Inter-SemiBold.woff`,
  },
];
