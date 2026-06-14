type StampCardProps = {
  points: number;
  target: number | null;
  nextRewardName?: string;
};

export default function StampCard({ points, target, nextRewardName }: StampCardProps) {
  if (!target) {
    return (
      <p className="muted" style={{ color: "var(--otoko-gold-2)", marginTop: 18, position: "relative", zIndex: 1 }}>
        Kamu sudah membuka semua reward. Nantikan reward baru!
      </p>
    );
  }

  const segments = 10;
  const filled = Math.min(segments, Math.floor((points / target) * segments));
  const remaining = Math.max(0, target - points);

  return (
    <div>
      <div className="stamp-row">
        {Array.from({ length: segments }).map((_, i) => (
          <span key={i} className={`stamp ${i < filled ? "filled" : ""}`}>
            {i < filled ? "☕" : ""}
          </span>
        ))}
      </div>
      <p className="muted" style={{ color: "var(--otoko-gold-2)", marginTop: 12, position: "relative", zIndex: 1, fontSize: "0.85rem" }}>
        {remaining > 0
          ? `${remaining} poin lagi untuk ${nextRewardName}`
          : `Cukup untuk ${nextRewardName} — tukar sekarang!`}
      </p>
    </div>
  );
}
