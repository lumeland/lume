export function insertContent(
  content: string,
  newContent: string,
  placeholder?: string,
) {
  if (content) {
    if (placeholder && content.includes(placeholder)) {
      return content.replace(
        placeholder,
        newContent,
      );
    }
    return `${content}\n${newContent}`;
  }

  return newContent;
}
