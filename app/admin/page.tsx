"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Member = { id: number; phone: string; name: string; points: number; created_at?: string };
type Reward = { id: number; name: string; description: string; points_required: number; active: number; };

const TABS = ["Input Transaksi", "Member", "Reward", "Verifikasi Redeem"] as const;
type Tab = (typeof TABS)[number];

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("Input Transaksi");
  return (
    <div className="page">
      <header className="topbar">
        <div className="container-wide topbar-inner">
          <Link href="/">
            <Image src="/otoko_blue.png" alt="Otoko Coffee" className="topbar-logo" width={120} height={36} style={{ objectFit: "contain" }} />
          </Link>
          <span className="tag">Kasir / Admin</span>
        </div>
      </header>

      <main className="container-wide" style={{ padding: "32px 32px 60px", flex: 1 }}>
        <div className="kanji-divider">管理 &nbsp; Admin</div>
        <h1 className="display" style={{ fontSize: "2rem", margin: "0 0 4px" }}>Dashboard Kasir</h1>
        <p className="muted" style={{ marginBottom: 28 }}>Input poin manual setelah transaksi selesai di ESB POSLite.</p>

        <div className="tabs">
          {TABS.map(t => (
            <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        <div style={{ maxWidth: 560 }}>
          {tab === "Input Transaksi" && <InputTransaksi />}
          {tab === "Member" && <MemberManager />}
          {tab === "Reward" && <RewardManager />}
          {tab === "Verifikasi Redeem" && <VerifyRedeem />}
        </div>
      </main>
      <footer className="foot">Otoko Coffee Rewards &mdash; prototype demo</footer>
    </div>
  );
}

function InputTransaksi() {
  const [phone, setPhone] = useState(""); const [amount, setAmount] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ name: string; pointsEarned: number; points: number } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setResult(null); setLoading(true);
    try {
      const res = await fetch("/api/transaction", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: phone.trim(), amount: Number(amount) }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Gagal mencatat transaksi"); return; }
      setResult({ name: data.member.name, pointsEarned: data.pointsEarned, points: data.member.points });
      setAmount("");
    } catch { setError("Gagal menghubungi server"); }
    finally { setLoading(false); }
  }

  return (
    <div className="card">
      <p className="eyebrow">Setelah transaksi selesai di POS</p>
      <h3 style={{ margin: "0 0 20px", fontSize: "1.5rem" }}>Catat Poin Member</h3>
      {error && <div className="banner banner-error">{error}</div>}
      {result && <div className="banner banner-success">+{result.pointsEarned} poin untuk {result.name}. Total poin: {result.points}.</div>}
      <form onSubmit={submit}>
        <div className="field"><label>Nomor HP Member</label><input type="tel" inputMode="numeric" placeholder="08xxxxxxxxxx" value={phone} onChange={e => setPhone(e.target.value)} required /></div>
        <div className="field"><label>Nominal Transaksi (Rp)</label><input type="number" min="0" step="1000" placeholder="45000" value={amount} onChange={e => setAmount(e.target.value)} required /></div>
        <button className="btn btn-primary btn-block" disabled={loading}>{loading ? "Menyimpan..." : "Tambahkan Poin"}</button>
      </form>
      <p className="muted" style={{ marginTop: 14 }}>Konversi: setiap Rp10.000 = 1 poin (dibulatkan ke bawah).</p>
    </div>
  );
}

function MemberManager() {
  const [query, setQuery] = useState(""); const [members, setMembers] = useState<Member[]>([]);
  const [showForm, setShowForm] = useState(false); const [newPhone, setNewPhone] = useState(""); const [newName, setNewName] = useState("");
  const [error, setError] = useState(""); const [success, setSuccess] = useState("");

  async function load(q = "") { const res = await fetch(`/api/admin/members?q=${encodeURIComponent(q)}`); setMembers((await res.json()).members); }
  useEffect(() => { load(); }, []);

  async function register(e: React.FormEvent) {
    e.preventDefault(); setError(""); setSuccess("");
    const res = await fetch("/api/admin/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: newPhone.trim(), name: newName.trim() }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Gagal mendaftarkan member"); return; }
    setSuccess(`Member ${data.member.name} berhasil didaftarkan.`); setNewPhone(""); setNewName(""); setShowForm(false); load(query);
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="row" style={{ marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: "1.3rem" }}>Daftar Member</h3>
          <button className="btn btn-outline btn-sm" onClick={() => setShowForm(v => !v)}>{showForm ? "Tutup" : "+ Member Baru"}</button>
        </div>
        {showForm && (
          <form onSubmit={register} style={{ marginBottom: 16 }}>
            {error && <div className="banner banner-error">{error}</div>}
            {success && <div className="banner banner-success">{success}</div>}
            <div className="field"><label>Nomor HP</label><input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} required /></div>
            <div className="field"><label>Nama</label><input type="text" value={newName} onChange={e => setNewName(e.target.value)} required /></div>
            <button className="btn btn-primary btn-block">Daftarkan</button>
          </form>
        )}
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Cari (nama / nomor HP)</label>
          <input type="text" value={query} onChange={e => { setQuery(e.target.value); load(e.target.value); }} />
        </div>
      </div>
      <div className="card">
        {members.length === 0 && <p className="muted">Tidak ada member.</p>}
        {members.map(m => (
          <div key={m.id} className="list-item">
            <div><p style={{ margin: 0, fontWeight: 500 }}>{m.name}</p><p className="muted mono" style={{ margin: 0 }}>{m.phone}</p></div>
            <p className="pill pill-gold mono">{m.points} poin</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RewardManager() {
  const [rewards, setRewards] = useState<Reward[]>([]); const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(""); const [description, setDescription] = useState(""); const [points, setPoints] = useState(""); const [error, setError] = useState("");

  async function load() { const res = await fetch("/api/rewards?all=1"); setRewards((await res.json()).rewards); }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault(); setError("");
    const res = await fetch("/api/rewards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description, points_required: Number(points) }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Gagal menambah reward"); return; }
    setName(""); setDescription(""); setPoints(""); setShowForm(false); load();
  }

  async function toggleActive(r: Reward) {
    await fetch("/api/rewards", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id, active: r.active ? 0 : 1 }) });
    load();
  }

  return (
    <div className="card">
      <div className="row" style={{ marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: "1.3rem" }}>Katalog Reward</h3>
        <button className="btn btn-outline btn-sm" onClick={() => setShowForm(v => !v)}>{showForm ? "Tutup" : "+ Reward Baru"}</button>
      </div>
      {showForm && (
        <form onSubmit={create} style={{ marginBottom: 18 }}>
          {error && <div className="banner banner-error">{error}</div>}
          <div className="field"><label>Nama Reward</label><input type="text" value={name} onChange={e => setName(e.target.value)} required /></div>
          <div className="field"><label>Deskripsi</label><input type="text" value={description} onChange={e => setDescription(e.target.value)} /></div>
          <div className="field"><label>Poin Dibutuhkan</label><input type="number" min="1" value={points} onChange={e => setPoints(e.target.value)} required /></div>
          <button className="btn btn-primary btn-block">Simpan Reward</button>
        </form>
      )}
      {rewards.map(r => (
        <div key={r.id} className="reward-card">
          <div>
            <p style={{ margin: "0 0 4px", fontWeight: 600, fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem" }}>{r.name}</p>
            <p className="muted" style={{ margin: 0 }}>{r.description}</p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p className="pill pill-gold mono" style={{ marginBottom: 8 }}>{r.points_required} poin</p><br />
            <button className="btn btn-outline btn-sm" onClick={() => toggleActive(r)}>{r.active ? "Nonaktifkan" : "Aktifkan"}</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function VerifyRedeem() {
  const [code, setCode] = useState(""); const [error, setError] = useState("");
  const [result, setResult] = useState<{ member_name: string; phone: string; reward_name: string; points_delta: number; created_at: string; } | null>(null);

  async function check(e: React.FormEvent) {
    e.preventDefault(); setError(""); setResult(null);
    const res = await fetch(`/api/admin/verify?code=${encodeURIComponent(code.trim())}`);
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Kode tidak ditemukan"); return; }
    setResult(data.redemption);
  }

  return (
    <div className="card">
      <p className="eyebrow">Saat member menukar reward</p>
      <h3 style={{ margin: "0 0 20px", fontSize: "1.5rem" }}>Verifikasi Kode Redeem</h3>
      {error && <div className="banner banner-error">{error}</div>}
      {result && (
        <div className="banner banner-success">
          Valid — {result.member_name} ({result.phone}) menukar <strong>{result.reward_name}</strong> ({Math.abs(result.points_delta)} poin) pada{" "}
          {new Date(result.created_at.replace(" ", "T") + "Z").toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}.
        </div>
      )}
      <form onSubmit={check}>
        <div className="field"><label>Kode Verifikasi</label><input type="text" placeholder="Misal: A1B2C3" value={code} onChange={e => setCode(e.target.value.toUpperCase())} required /></div>
        <button className="btn btn-primary btn-block">Cek Kode</button>
      </form>
    </div>
  );
}
