import type { JsonldData } from "../../../plugins/json_ld.ts";

export const jsonLd: JsonldData = {
  "@type": "WebSite",
  url: "/",
  headline: "Óscar Otero - Web designer and developer",
  description: "I’m just a designer and web developer",
  name: "Óscar Otero",
  author: {
    "@type": "Person",
    name: "Óscar Otero",
  },
}

export default function () {
  return "Page content";
}