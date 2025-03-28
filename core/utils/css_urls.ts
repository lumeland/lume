type UrlWalker = (url: string, type: string) => string | Promise<string>;
type Position = [string, string, number, number];
type Index = [string, number];

export async function walkUrls(
  code: string,
  walker: UrlWalker,
): Promise<string> {
  let result = "";
  let index = 0;
  let position = next(code, index);

  while (position) {
    const [type, url, start, end] = position;
    const newUrl = await walker(url, type);
    const quotedUrl = url.startsWith("data:")
      ? `'${newUrl.replaceAll("'", "\\'")}'`
      : `"${newUrl.replaceAll('"', '\\"')}"`;
    result += `${code.slice(index, start)}${quotedUrl}`;
    index = end;
    position = next(code, index);
  }

  return result + code.slice(index);
}

function next(code: string, index = 0): Position | undefined {
  const nextUrl = code.indexOf("url(", index);
  const nextComment = code.indexOf("/*", index);
  const nextImport = code.indexOf("@import ", index);

  let found: Index | undefined;

  if (nextUrl !== -1) {
    found = ["url", nextUrl];
  }
  if (nextComment !== -1 && (!found || nextComment < found[1])) {
    found = ["comment", nextComment];
  }
  if (nextImport !== -1 && (!found || nextImport < found[1])) {
    found = ["import", nextImport];
  }

  if (!found) {
    return;
  }

  // If it's a comment, find the end of it
  if (found[0] === "comment") {
    const end = code.indexOf("*/", found[1]);
    if (end === -1) {
      return;
    }
    return next(code, end + 2);
  }

  if (found[0] === "import") {
    const double = code.indexOf('"', found[1]);
    const single = code.indexOf("'", found[1]);
    const urlFn = code.indexOf("url(", found[1]);

    let foundImport: Index | undefined;

    if (double !== -1) {
      foundImport = ["double", double];
    }
    if (single !== -1 && (!foundImport || single < foundImport[1])) {
      foundImport = ["single", single];
    }

    // It's has a url(), so delegate to the url() logic
    if (urlFn !== -1 && (!foundImport || urlFn < foundImport[1])) {
      return next(code, urlFn);
    }

    if (!foundImport) {
      return;
    }

    const start = foundImport[1];
    const end =
      code.indexOf(foundImport[0] === "double" ? '"' : "'", start + 1) + 1;
    return ["url", code.slice(start + 1, end - 1), start, end];
  }

  if (found[0] === "url") {
    const start = code.indexOf("(", found[1]) + 1;
    let url = code.slice(start).trim();
    const quote = url.startsWith('"') || url.startsWith("'")
      ? url[0]
      : undefined;
    url = quote ? url.slice(1) : url;
    let end = findUrlEnd(url, quote);
    url = url.slice(0, end);
    end += start + (quote ? 2 : 0);
    url = url.replace(/\\'/g, "'").replace(/\\"/g, '"');
    return ["url", url, start, end];
  }
}

function findUrlEnd(code: string, quote?: string): number {
  if (!quote) {
    return code.indexOf(")");
  }

  let end = code.indexOf(quote);

  while (end !== -1 && code[end - 1] === "\\") {
    end = code.indexOf(quote, end + 1);
  }

  return end === -1 ? code.indexOf(")") : end;
}
