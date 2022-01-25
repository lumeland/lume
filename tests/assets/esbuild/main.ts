/// <reference lib="dom" />
import toUppercase from "./modules/to_uppercase.ts";

document.querySelectorAll("h1")?.forEach((h1) => {
  h1.innerHTML = toUppercase(h1.innerHTML);
});
