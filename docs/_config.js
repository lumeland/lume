import lume from "https://deno.land/x/lume/mod.js";

const site = lume({
  src: ".",
  dest: "_site",
});

site.copy("styles.css");
site.copy("logo.svg");

export default site;
