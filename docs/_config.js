import lume from "../mod.js";

const site = lume({
  src: ".",
  dest: "_site",
});

site.copy("styles.css");
site.copy("logo.svg");
site.copy("favicon.ico");
site.copy("favicon-32x32.png");

site.script("listar", "ls -al _site", "ls -al .");
site.addEventListener("beforeBuild", "listar");

export default site;
