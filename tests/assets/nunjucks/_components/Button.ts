interface Props {
  content: string;
  className?: string;
}

export default function ({ content, className }: Props) {
  return `<button class="${className || ""}" type="button">${content}</button>`;
}

export const css = `
button {
  background-color: blue;
}
`;

export const js = `
document.querySelectorAll("button").forEach(button => {
  button.addEventListener("click", () => {
    alert("Hello world!");
  });
});
`;
