import lume from "../mod.js";

const site = lume({
  src: ".",
  dest: "_site",
});

site.copy("styles.css");
site.copy("logo.svg");
site.copy("favicon.ico");

export default site;
