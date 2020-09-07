export default class Explorer {
  constructor(site) {
    this.site = site;
  }

  pages(tags, path, recursive) {
    return this.#searchPages(tags, path, recursive);
  }

  #searchPages(tags = [], path = "/", recursive = true) {
    if (typeof tags === "string") {
      tags = tags.split(/\s+/).filter((tag) => tag);
    }

    const filter = tags && tags.length
      ? (page) => isHtml(page) && tags.every((tag) => page.tags.has(tag))
      : isHtml;

    return Array.from(this.site.getPages(filter, path, recursive))
      .map((entry) => entry[0])
      .sort((a, b) => b.data.date - a.data.date);
  }
}

function isHtml(page) {
  return page.isPage && page.dest && page.dest.path.endsWith(".html");
}
