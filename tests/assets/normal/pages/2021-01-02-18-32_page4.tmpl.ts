export const title = "Page 4";
export const site = "Overrided site name";

interface Data {
  title: string;
  site: string;
}

export default function ({ title, site }: Data) {
  return Promise.resolve(`Content of ${title} in ${site}`);
}
