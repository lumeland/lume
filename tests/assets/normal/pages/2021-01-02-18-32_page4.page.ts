import { Data } from "../../../../core/file.ts";

export const title = "Page 4";
export const site = "Overrided site name";

interface PageData extends Data {
  title: string;
  site: string;
}

export default function ({ title, site, page }: PageData) {
  return Promise.resolve(
    `Content of ${title} in ${site}, from the file ${
      page.src.path + page.src.ext
    }`,
  );
}
