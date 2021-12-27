import { bold, cyan, dim, red, yellow } from "../deps/colors.ts";
import { fromFileUrl } from "../deps/path.ts";

/** Error payload interface  */
export interface ErrorData {
  cause?: Error;
  name?: string;
  mark?: Mark;
  [key: string]: unknown;
}

/** Parsed stacktraces */
export interface Mark {
  name?: string;
  file?: string;
  line?: number;
  column?: number;
}

/**
 * Generic Exception to throw errors.
 * It allows to include extra data.
 */
export class Exception extends Error {
  data?: Record<string, unknown>;
  mark?: Mark;

  constructor(message: string, data: ErrorData = {}) {
    const options = data.cause ? { cause: data.cause } : {};
    delete data.cause;

    super(message, options);

    if (data.name) {
      this.name = data.name;
      delete data.name;
    }

    if (data.mark) {
      this.mark = data.mark;
      delete data.mark;
    }

    this.data = data;
  }
}

/** Pretty-print an Error or Exception instance */
export function printError(error: Error, caused = false) {
  console.log();

  // Print the error message
  if (caused) {
    console.error(`Caused by ${bold(red(`${error.name}:`))}`, error.message);
  } else {
    console.error(`${bold(red(`${error.name}:`))}`, error.message);
  }

  // Print the data and mark of Exception instances
  if (error instanceof Exception) {
    if (error.mark) {
      const { mark } = error;
      const code = getCode(mark);

      if (code && mark.file && mark.line && mark.column) {
        console.log(
          `    at ${cyan(mark.file)}:${yellow(mark.line.toString())}:${
            yellow(mark.column.toString())
          }`,
        );
        console.log(code);
      }
    }

    for (let [key, value] of Object.entries(error.data ?? {})) {
      if (key === "page") {
        // @ts-ignore: this is a Page instance
        value = value.src.path + value.src.ext;
      }
      console.log(dim(`- ${key}:`), value);
    }
  }

  // Print the error stack
  if (error.stack) {
    const marks = parseStack(error);

    marks.forEach((mark) => {
      const log: string[] = ["at"];
      let code: string | undefined;

      if (mark.name) {
        log.push(bold(mark.name));
      }

      if (mark.file) {
        if (mark.line && mark.column) {
          log.push(
            `(${cyan(mark.file)}:${yellow(mark.line.toString())}:${
              yellow(mark.column.toString())
            })`,
          );

          try {
            const path = fromFileUrl(mark.file);
            if (path.startsWith(cwd)) {
              code = getCode(mark);
            }
          } catch {
            // Do nothing
          }
        } else {
          log.push(`(${cyan(mark.file)})`);
        }
      }

      console.log("   ", log.join(" "));

      if (code) {
        console.log(code);
        console.log();
      }
    });
  }

  // Print the error cause
  if (error.cause) {
    printError(error.cause, true);
  }
}

const cwd = Deno.cwd();

/** Read the errored code from a mark */
function getCode(mark: Mark): string | undefined {
  if (!mark.file || !mark.line || !mark.column) {
    return;
  }

  try {
    const path = mark.file.startsWith("file://")
      ? fromFileUrl(mark.file)
      : mark.file;

    if (!path.startsWith(cwd)) {
      return;
    }
    const { line, column } = mark;
    const code: string[] = [];
    const lines = Deno.readTextFileSync(path).split("\n");

    if (lines[line - 2]) {
      code.push(`    ${dim(`| ${line - 1} |`)} ${lines[line - 2]}`);
    }

    code.push(
      `    ${dim(`| ${bold(red(line.toString()))} |`)} ${
        bold(lines[line - 1])
      }`,
      `    ${dim(`| ${bold(red("~".repeat(line.toString().length)))} |`)} ${
        red("~".repeat(column - 1) + "^")
      }`,
    );

    if (lines[line]) {
      code.push(`    ${dim(`| ${line + 1} |`)} ${lines[line]}`);
    }

    return code.join("\n");
  } catch {
    // Do nothing
  }
}

/**
 * Function to parse the stacktrace
 * Code from: https://github.com/stacktracejs/stacktrace.js/blob/master/dist/stacktrace.js
 */
export function parseStack(error: Error): Mark[] {
  const lines =
    error.stack?.split("\n").filter((line) =>
      !!line.match(/^\s*at .*(\S+:\d+|\(native\))/m)
    ) || [];

  return lines.map(function (line): Mark {
    if (line.indexOf("(eval ") > -1) {
      // Throw away eval information until we implement stacktrace.js/stackframe#8
      line = line.replace(/eval code/g, "eval").replace(
        /(\(eval at [^()]*)|(\),.*$)/g,
        "",
      );
    }

    let sanitizedLine = line.replace(/^\s+/, "").replace(/\(eval code/g, "(");

    // capture and preseve the parenthesized location "(/foo/my bar.js:12:87)" in
    // case it has spaces in it, as the string is split on \s+ later on
    const location = sanitizedLine.match(/ (\((.+):(\d+):(\d+)\)$)/);

    // remove the parenthesized location from the line, if it was matched
    sanitizedLine = location
      ? sanitizedLine.replace(location[0], "")
      : sanitizedLine;

    const tokens = sanitizedLine.split(/\s+/).slice(1);
    // if a location was matched, pass it to extractLocation() otherwise pop the last token
    const locationString = location ? location[1] : tokens.pop();
    const locationParts = locationString ? extractLocation(locationString) : [];
    const functionName = tokens.join(" ") || undefined;
    const fileName = ["eval", "<anonymous>"].indexOf(locationParts[0]) > -1
      ? undefined
      : locationParts[0];

    return {
      name: functionName,
      file: fileName?.replace(/#.*$/, ""), // Removed hash from file path
      line: locationParts[1] ? parseInt(locationParts[1]) : undefined,
      column: locationParts[2] ? parseInt(locationParts[2]) : undefined,
    };
  });
}

/**
 * Separate line and column numbers from a string of the form: (URI:Line:Column)
 * Code from: https://github.com/stacktracejs/stacktrace.js/blob/master/dist/stacktrace.js
 */
export function extractLocation(source: string): [string, string?, string?] {
  // Fail-fast but return locations like "(native)"
  if (source.indexOf(":") === -1) {
    return [source];
  }

  const regExp = /(.+?)(?::(\d+))?(?::(\d+))?$/;
  const parts = regExp.exec(source.replace(/[()]/g, ""));

  if (!parts) {
    return [source];
  }

  const [, path, line, column] = parts;
  return [path, line, column];
}
