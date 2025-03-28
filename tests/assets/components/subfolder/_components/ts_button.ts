export const css = `
.button_ts {
  color: white;
  background-color: blue;
}
`;

interface Props {
  text: string;
}

export default function ({ text }: Props) {
  return `<button class="button_ts">${text}</button>`;
}
