export function Rate({ value }: { value: number | null }) {
  if (value === null) return <span className="otp-rate" data-tone="muted">—</span>;

  const tone = value >= 52 ? "up" : value <= 48 ? "down" : undefined;
  return <span className="otp-rate" data-tone={tone}>{value.toFixed(1)}%</span>;
}

export function signed(value: number | null) {
  if (value === null) return "—";
  return `${value > 0 ? "+" : ""}${value.toLocaleString()}`;
}

/** A signed gold or XP lead, green when ahead and red when behind. Within ±100 counts as even. */
export function Diff({ value, even = 100 }: { value: number | null; even?: number }) {
  if (value === null) return <span className="otp-rate" data-tone="muted">—</span>;

  const tone = value >= even ? "up" : value <= -even ? "down" : undefined;
  return <span className="otp-rate" data-tone={tone}>{signed(value)}</span>;
}

/** Win probability added, in percentage points; within ±1 counts as neutral. */
export function Wpa({ value, small, title }: { value: number | null; small?: boolean; title?: string }) {
  if (value === null) return <span className="otp-rate" data-tone="muted">—</span>;

  const tone = value >= 1 ? "up" : value <= -1 ? "down" : undefined;
  return (
    <span className="otp-rate" data-tone={tone} title={title}>
      {value > 0 ? "+" : ""}{value.toFixed(1)}%{small && <span title="Small sample">*</span>}
    </span>
  );
}
