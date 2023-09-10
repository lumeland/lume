import { PageData } from "../../../../core.ts";

export const title = "Page 4";
export const site = "Overrided site name";

interface Data extends PageData {
  title: string;
  site: string;
}

export default function ({ title, site, page }: Data) {
  return Promise.resolve(
    `Content of ${title} in ${site}, from the file ${
      page.src.path + page.src.ext
    }`,
  );
}
