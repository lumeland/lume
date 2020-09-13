class Base {
  src = {};
  data = {};
  tags = new Set();

  constructor(src) {
    this.src = src;
  }

  addTags(tags) {
    if (!tags) {
      return;
    }

    if (tags instanceof Set || Array.isArray(tags)) {
      tags.forEach((tag) => this.tags.add(tag));
      return;
    }

    this.tags.add(tags);
  }
}

export class Page extends Base {
  content = undefined;
  dest = {};

  addData(data) {
    if (!data) {
      return;
    }

    if (data.tags) {
      this.addTags(data.tags);
      delete data.tags;
    }

    if (data.content) {
      this.content = data.content;
      delete data.content;
    }

    this.data = { ...data, ...this.data };
  }
}

export class Directory extends Base {
  pages = new Map();
  dirs = new Map();

  addData(data) {
    if (!data) {
      return;
    }

    if (data.tags) {
      this.addTags(data.tags);
      delete data.tags;
    }

    this.data = { ...data, ...this.data };
  }

  *getPages(recursive = true) {
    for (const page of this.pages.values()) {
      yield [page, this];
    }

    if (recursive) {
      for (const dir of this.dirs.values()) {
        yield* dir.getPages();
      }
    }
  }

  expand() {
    for (const [key, page] of this.pages.entries()) {
      page.addData(this.data);

      if (page.data.ignore) {
        this.pages.delete(key);
        continue;
      }

      page.addTags(this.tags);
    }

    for (const dir of this.dirs.values()) {
      dir.addData(this.data);
      dir.addTags(this.tags);
      dir.expand();
    }
  }
}
