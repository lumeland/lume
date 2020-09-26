export default class Searcher {
  constructor(site) {
    this.site = site;
  }

  folder(path = "/") {
    return this.site.source.getDirectory(path);
  }

  pages(tags, path, recursive, sort) {
    return this.#searchPages(tags, path, recursive, sort);
  }

  #searchPages(tags = [], path = "/", recursive = true, sort = "date") {
    tags = getTags(tags);

    const filter = tags
      ? (page) => isHtml(page) && tags.every((tag) => page.tags.has(tag))
      : isHtml;

    return Array.from(this.site.getPages(filter, path, recursive))
      .map((entry) => entry[0])
      .sort(sort === "alpha" ? sortByFile : sortByDate);
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

function sortByDate(a, b) {
  return a.data.date - b.data.date;
}
function sortByFile(a, b) {
  return (a.src.path < b.src.path) ? -1 : 1;
}
