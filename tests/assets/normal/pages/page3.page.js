export const title = "Page 3";

export const date = new Date(2020, 0, 1);

export function url() {
  return "/page_" + (1 + 2) + "/";
}

export default `Content of ${title}`;
