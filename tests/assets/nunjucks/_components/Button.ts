interface Props {
  content: string;
  className?: string;
}

export default function ({ content, className }: Props) {
  return `<button class="${className || ""}" type="button">${content}</button>`;
}
