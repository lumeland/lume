import lume from "@lumeland/lume/mod.ts";

const site = lume({
  src: "proba",
  dest: "proba/_site",
});

site.process([".html"], (pages) => {
  for (const page of pages) {
    const title = page.document.querySelector("title");
    if (title) {
      title.innerText = title.innerText.toUpperCase();
    }
  }
});
// site.add("ola.vto");

export default site;
