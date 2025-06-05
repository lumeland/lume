const byteUnit = Intl.NumberFormat("en", {
  notation: "compact",
  style: "unit",
  unit: "byte",
  unitDisplay: "narrow",
});

export function bytes(bytes: number) {
  return byteUnit.format(bytes);
}

const percentageUnit = Intl.NumberFormat("en", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function percentage(initialValue: number, finalValue: number) {
  if (initialValue === finalValue) {
    return "0%";
  }

  const ratio = -(1 - finalValue / initialValue);

  if (ratio < 0) {
    return percentageUnit.format(ratio);
  }

  return "+" + percentageUnit.format(ratio);
}

const secondUnit = Intl.NumberFormat("en", {
  notation: "compact",
  style: "unit",
  unit: "second",
  unitDisplay: "short",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const milisecondUnit = Intl.NumberFormat("en", {
  notation: "compact",
  style: "unit",
  unit: "millisecond",
  unitDisplay: "short",
  maximumFractionDigits: 0,
});

export function duration(miliseconds: number) {
  if (miliseconds < 1000) {
    return milisecondUnit.format(miliseconds);
  }

  return secondUnit.format(miliseconds / 1000);
}
