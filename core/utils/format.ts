const byteUnit = Intl.NumberFormat("en", {
  notation: "compact",
  style: "unit",
  unit: "byte",
  unitDisplay: "narrow",
});

export function bytes(bytes: number) {
  return byteUnit.format(bytes);
}
