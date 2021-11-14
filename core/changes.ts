import { Page, ScopeFilter } from "../core.ts";

/** This class manages the file changes to know which files needs to be updated */
export default class Changes {
  scopes: Set<ScopeFilter>;
  changed: Set<ScopeFilter> = new Set();
  noScoped = false;

  constructor(scopes: Set<ScopeFilter>) {
    this.scopes = scopes;
  }

  /** Register a filename that have changed */
  add(file: string) {
    let found = false;
    for (const scopeFn of this.scopes) {
      if (scopeFn(file)) {
        this.changed.add(scopeFn);
        found = true;
        break;
      }
    }

    if (!found) {
      this.noScoped = true;
    }
  }

  /** Returns a function to filter the pages that must be rebuild */
  getFilter(): (pages: Iterable<Page>) => Generator<Page, void, unknown> {
    // There's no any scope, so rebuild all pages
    if (this.scopes.size === 0) {
      return function* (pages: Iterable<Page>) {
        yield* pages;
      };
    }

    const { changed, noScoped } = this;

    // Calculate scoped extensions that didn't change
    const notChanged: ScopeFilter[] = [];

    for (const scopeFn of this.scopes) {
      if (!changed.has(scopeFn)) {
        notChanged.push(scopeFn);
      }
    }

    // Generate the filter function
    return function* (pages: Iterable<Page>) {
      pages:
      for (const page of pages) {
        const path = page.src.path + page.src.ext;

        // It matches with any scope that has changed
        for (const scopeFn of changed) {
          if (scopeFn(path)) {
            yield page;
            continue pages;
          }
        }

        // It's not scoped
        if (noScoped && notChanged.every((scopeFn) => !scopeFn(path))) {
          yield page;
        }
      }
    };
  }
}
