import { join, extname, basename, normalize } from "../../deps/path.js";

export default function transformPermalink(page) {
  const path = getDest(page);
  page.dest.path = path;
  page.url = getUrl(path);
}

function getDest(page) {
  if (!page.isPage) {
    return page.data.permalink || page.src.path;
  }

  const permalink = page.data.permalink ||
    page.src.path.slice(0, -page.src.ext.length);

  if (extname(permalink)) {
    return permalink;
  }

  if (basename(permalink) === "index") {
    return `${permalink}.html`;
  }

  return join(permalink, "index.html");
}

function getUrl(permalink) {
  if (permalink.endsWith("index.html")) {
    permalink = permalink.slice(0, -10);
  }

  return normalize(`/${permalink}`);
}
