export const name = "button_jsx";
export const css = `
.button_jsx {
  color: white;
  background-color: blue;
}
`;

export default function ({ text }) {
  return <button class="button_jsx">{text}</button>;
}
