"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import StampCard from "@/components/StampCard";

type Member = { id: number; phone: string; name: string; points: number };
type Tx = { id: number; type: string; amount: number; points_delta: number; reward_name: string | null; note: string | null; created_at: string; };
type Reward = { id: number; name: string; description: string; points_required: number; active: number; };

export default function MemberDashboard() {
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [history, setHistory] = useState<Tx[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [shopName, setShopName] = useState("Otoko Coffee");
  const [error, setError] = useState("");
  const [redeemResult, setRedeemResult] = useState<{ reward: string; code: string } | null>(null);
  const [redeeming, setRedeeming] = useState<number | null>(null);

  async function loadAll(phone: string) {
    const [mRes, rRes] = await Promise.all([fetch(`/api/member?phone=${encodeURIComponent(phone)}`), fetch("/api/rewards")]);
    if (!mRes.ok) { localStorage.removeItem("memberPhone"); router.push("/member"); return; }
    const mData = await mRes.json();
    const rData = await rRes.json();

    console.log("MEMBER API", mData);
    console.log("REWARDS API", rData);
    setMember(mData.member ?? null); setHistory(Array.isArray(mData.history) ? mData.history : []); setShopName(mData.shopName ?? "Otoko Coffee"); setRewards(Array.isArray(rData.rewards) ? rData.rewards : []);
  }

  useEffect(() => {
    const phone = localStorage.getItem("memberPhone");
    if (!phone) { router.push("/member"); return; }
    loadAll(phone);
  }, []);

  async function handleRedeem(rewardId: number) {
    if (!member) return;
    setError(""); setRedeeming(rewardId);
    try {
      const res = await fetch("/api/redeem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: member.phone, rewardId }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Gagal menukar reward"); return; }
      setRedeemResult({ reward: data.reward, code: data.code });
      await loadAll(member.phone);
    } catch { setError("Gagal menghubungi server"); }
    finally { setRedeeming(null); }
  }

  if (!member) return (
    <div className="page">
      <main className="container" style={{ padding: "60px 24px", textAlign: "center" }}>
        <p className="muted">Memuat data member...</p>
      </main>
    </div>
  );

  const safeRewards = Array.isArray(rewards) ? rewards : [];

  const nextReward = safeRewards
    .filter(r => r.points_required > member.points)
    .sort((a, b) => a.points_required - b.points_required)[0];

  return (
    <div className="page">
      <header className="topbar">
        <div className="container topbar-inner">
          <Link href="/">
            <Image src="/otoko_blue.png" alt="Otoko Coffee" className="topbar-logo" width={120} height={36} style={{ objectFit: "contain" }} />
          </Link>
          <button onClick={() => { localStorage.removeItem("memberPhone"); router.push("/member"); }} className="btn btn-ghost btn-sm">
            Keluar
          </button>
        </div>
      </header>

      <main className="container" style={{ padding: "28px 24px 48px", flex: 1 }}>
        <div className="card-dark">
          <p className="eyebrow" style={{ color: "var(--otoko-gold)" }}>
            {shopName} &middot; 会員カード
          </p>
          <p style={{ color: "var(--otoko-gold-2)", fontSize: "0.82rem", margin: "2px 0 0", position: "relative", zIndex: 1 }}>
            Halo, {member.name}
          </p>
          <p className="balance" style={{ color: "#fff", position: "relative", zIndex: 1 }}>{member.points}</p>
          <p style={{ color: "var(--otoko-gold-2)", margin: 0, fontSize: "0.8rem", letterSpacing: "0.12em", textTransform: "uppercase", position: "relative", zIndex: 1 }}>
            poin terkumpul
          </p>
          <StampCard points={member.points} target={nextReward ? nextReward.points_required : null} nextRewardName={nextReward?.name} />
        </div>

        {redeemResult && (
          <div className="card" style={{ marginTop: 20, textAlign: "center" }}>
            <p className="eyebrow">Reward berhasil ditukar</p>
            <h3 style={{ margin: "0 0 20px", fontSize: "1.5rem" }}>{redeemResult.reward}</h3>
            <div className="qr-box">{redeemResult.code}</div>
            <p className="muted" style={{ marginTop: 14, lineHeight: 1.6 }}>
              Tunjukkan kode ini ke kasir untuk mengambil reward kamu.
            </p>
            <button className="btn btn-outline btn-sm" onClick={() => setRedeemResult(null)}>Tutup</button>
          </div>
        )}

        {error && <div className="banner banner-error" style={{ marginTop: 20 }}>{error}</div>}

        <section style={{ marginTop: 32 }}>
          <div className="kanji-divider">報酬 &nbsp; Reward</div>
          {safeRewards.length === 0 && <p className="muted">Belum ada reward tersedia.</p>}
          {safeRewards.map(r => {
            const unlocked = member.points >= r.points_required;
            return (
              <div key={r.id} className={`reward-card ${unlocked ? "" : "locked"}`}>
                <div>
                  <p style={{ fontWeight: 600, margin: "0 0 4px", fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem" }}>{r.name}</p>
                  <p className="muted" style={{ margin: 0 }}>{r.description}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p className="pill pill-gold" style={{ marginBottom: 8, display: "inline-block" }}>{r.points_required} poin</p>
                  <br />
                  <button className="btn btn-gold btn-sm" disabled={!unlocked || redeeming === r.id} onClick={() => handleRedeem(r.id)}>
                    {redeeming === r.id ? "Memproses..." : unlocked ? "Tukar" : "Belum cukup"}
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        <section style={{ marginTop: 36 }}>
          <div className="kanji-divider">履歴 &nbsp; Riwayat</div>
          <div className="card">
            {history.length === 0 && <p className="muted">Belum ada transaksi.</p>}
            {Array.isArray(history) &&
              history.map(tx => (
              <div key={tx.id} className="list-item">
                <div>
                  <p style={{ margin: 0, fontWeight: 500 }}>
                    {tx.type === "earn" ? "Belanja di kasir" : `Tukar: ${tx.reward_name}`}
                  </p>
                  <p className="muted" style={{ margin: 0 }}>
                    {new Date(tx.created_at.replace(" ", "T") + "Z").toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                    {tx.type === "earn" && ` · Rp${tx.amount.toLocaleString("id-ID")}`}
                  </p>
                </div>
                <p className="mono" style={{ margin: 0, fontWeight: 600, color: tx.points_delta >= 0 ? "#3d5e30" : "var(--otoko-red)" }}>
                  {tx.points_delta >= 0 ? "+" : ""}{tx.points_delta}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="foot">Otoko Coffee Rewards &mdash; prototype demo</footer>
    </div>
  );
}
