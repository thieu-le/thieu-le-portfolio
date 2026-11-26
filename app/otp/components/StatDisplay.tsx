export function Rate({ value }: { value: number | null }) {
  if (value === null) return <span className="otp-rate" data-tone="muted">—</span>;

  const tone = value >= 52 ? "up" : value <= 48 ? "down" : undefined;
  return <span className="otp-rate" data-tone={tone}>{value.toFixed(1)}%</span>;
}

export function signed(value: number | null) {
  if (value === null) return "—";
  return `${value > 0 ? "+" : ""}${value.toLocaleString()}`;
}
