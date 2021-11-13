import { Page } from "../core.ts";

/** This class manages the file changes to know which files needs to be updated */
export default class Changes {
  scopes: Set<string[]>;
  changed: Set<string> = new Set();
  noScoped = false;

  constructor(scopes: Set<string[]>) {
    this.scopes = scopes;
  }

  add(file: string) {
    let found = false;
    for (const scope of this.scopes) {
      if (scope.some((ext) => file.endsWith(ext))) {
        scope.forEach((ext) => this.changed.add(ext));
        found = true;
        break;
      }
    }

    if (!found) {
      this.noScoped = true;
    }
  }

  getFilter(): (pages: Iterable<Page>) => Generator<Page, void, unknown> {
    if (this.scopes.size === 0) {
      return function* (pages: Iterable<Page>) {
        yield* pages;
      };
    }

    const { changed, noScoped } = this;

    // Calculate scoped extensions that didn't change
    const notChanged: Set<string> = new Set();

    for (const scope of this.scopes) {
      scope.forEach((ext) => {
        if (!changed.has(ext)) {
          notChanged.add(ext);
        }
      });
    }

    // Generate the filter function
    return function* (pages: Iterable<Page>) {
      for (const page of pages) {
        const ext = page.src.ext!;

        // It's in the list of the changed extensions
        if (changed.has(ext)) {
          yield page;
        }

        // It's not scoped
        if (noScoped && !notChanged.has(ext)) {
          yield page;
        }
      }
    };
  }
}
