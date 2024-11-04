export default function toUppercase(text: string) {
  return text.toUpperCase();
}

export async function toLowercase(text: string) {
  const { toLowercase } = await import("../other/to_lowercase.ts");

  return toLowercase(text);
}
