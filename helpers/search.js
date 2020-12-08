export default class Search {
  #site = null;

  constructor(site) {
    this.#site = site;
  }

  folder(path = "/") {
    return this.#site.source.getDirectory(path);
  }

  pages(tags, sort) {
    return this.#searchPages(tags, sort);
  }

  nextPage(url, tags, sort) {
    const pages = this.pages(tags, sort);
    const index = pages.findIndex((page) => page.data.url === url);

    return (index === -1) ? undefined : pages[index + 1];
  }

  previousPage(url, tags, sort) {
    const pages = this.pages(tags, sort);
    const index = pages.findIndex((page) => page.data.url === url);

    return (index <= 0) ? undefined : pages[index - 1];
  }

  #searchPages(tags = [], sort = "date") {
    tags = getTags(tags);

    const filter = (page) => {
      if (page.dest.ext !== ".html") {
        return false;
      }

      if (tags && !tags.every((tag) => page.tags.has(tag))) {
        return false;
      }

      return true;
    };

    return this.#site.pages
      .filter(filter)
      .sort(sort === "file" ? sortByFilename : sortByDate);
  }
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

function sortByFilename(a, b) {
  return (a.src.path < b.src.path) ? -1 : 1;
}
