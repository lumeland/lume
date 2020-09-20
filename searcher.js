export default class Searcher {
  constructor(site) {
    this.site = site;
  }

  folder(path = "/") {
    return this.site.source.getDirectory(path);
  }

  pages(tags, path, recursive) {
    return this.#searchPages(tags, path, recursive);
  }

  #searchPages(tags = [], path = "/", recursive = true) {
    tags = getTags(tags);

    const filter = tags
      ? (page) => isHtml(page) && tags.every((tag) => page.tags.has(tag))
      : isHtml;

    return Array.from(this.site.getPages(filter, path, recursive))
      .map((entry) => entry[0])
      .sort((a, b) => a.data.date - b.data.date);
  }
}

function isHtml(page) {
  return page.dest.ext === ".html";
}

function getTags(tags) {
  if (typeof tags === "string") {
    tags = tags.split(/\s+/).filter((tag) => tag);
  }

  return tags.length ? tags : null;
}
