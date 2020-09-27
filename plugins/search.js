export default function () {
  return (site) => {
    site.helper("search", {
      folder(path = "/") {
        return site.source.getDirectory(path);
      },

      pages(tags, sort) {
        return searchPages(tags, sort);
      },
    });

    function searchPages(tags = [], sort = "date") {
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

      return Array.from(site.getPages())
        .map((entry) => entry[0])
        .filter(filter)
        .sort(sort === "file" ? sortByFilename : sortByDate);
    }
  };
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
