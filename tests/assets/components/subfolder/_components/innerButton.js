export default async function ({ comp, text }) {
  return `<div>${await comp.button_jsx({ text })}</div>`;
}
