import type { Page } from "../file.ts";

export function insertContent(
  page: Page,
  content: string,
  placeholder?: string,
) {
  const pageContent = page.text;

  if (pageContent) {
    if (placeholder && pageContent.includes(placeholder)) {
      page.content = pageContent.replace(
        placeholder,
        content,
      );
    } else {
      page.content += `\n${content}`;
    }
  } else {
    page.content = content;
  }
}
