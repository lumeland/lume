/// <reference lib="dom" />
import toUppercase from "./modules/to_uppercase.ts";
import data from "./data.json";

// https://github.com/lumeland/lume/issues/442
import "https://esm.sh/v127/prop-types@15.8.1/denonext/prop-types.development.mjs";

document.querySelectorAll("h1")?.forEach((h1) => {
  h1.innerHTML = toUppercase(h1.innerHTML + data.foo);
});
