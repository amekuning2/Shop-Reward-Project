"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function MemberLogin() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch(`/api/member?phone=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404) { setMode("register"); return; }
        setError(data.error || "Terjadi kesalahan");
        return;
      }
      localStorage.setItem("memberPhone", phone.trim());
      router.push("/member/dashboard");
    } catch { setError("Gagal menghubungi server"); }
    finally { setLoading(false); }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Gagal mendaftar"); return; }
      localStorage.setItem("memberPhone", phone.trim());
      router.push("/member/dashboard");
    } catch { setError("Gagal menghubungi server"); }
    finally { setLoading(false); }
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="container topbar-inner">
          <Link href="/">
            <Image src="/otoko_blue.png" alt="Otoko Coffee" className="topbar-logo" width={120} height={36} style={{ objectFit: "contain" }} />
          </Link>
          <span className="tag">Member</span>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center" }}>
        <div className="container" style={{ padding: "48px 24px" }}>
          <div className="kanji-divider">会員 &nbsp; Member</div>
          <p className="eyebrow">{mode === "login" ? "Masuk" : "Daftar Member Baru"}</p>
          <h1 className="display" style={{ fontSize: "2.2rem", margin: "0 0 28px" }}>
            {mode === "login" ? "Cek poin kamu" : "Selamat datang di Otoko Coffee"}
          </h1>

          {error && <div className="banner banner-error">{error}</div>}

          {mode === "login" ? (
            <form onSubmit={handleLogin}>
              <div className="field">
                <label htmlFor="phone">Nomor HP</label>
                <input id="phone" type="tel" inputMode="numeric" placeholder="08xxxxxxxxxx" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>
              <button className="btn btn-primary btn-block" disabled={loading}>
                {loading ? "Memeriksa..." : "Lihat Poin Saya"}
              </button>
              <p className="muted" style={{ marginTop: 14, textAlign: "center", lineHeight: 1.6 }}>
                Belum punya akun? Masukkan nomor HP lalu lanjut daftar otomatis.
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="banner banner-success">Nomor belum terdaftar. Lengkapi nama untuk membuat akun baru.</div>
              <div className="field">
                <label htmlFor="phone2">Nomor HP</label>
                <input id="phone2" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="name">Nama Lengkap</label>
                <input id="name" type="text" placeholder="Nama lengkap" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <button className="btn btn-primary btn-block" disabled={loading}>
                {loading ? "Mendaftar..." : "Daftar & Mulai Kumpulkan Poin"}
              </button>
              <button type="button" className="btn btn-outline btn-block" style={{ marginTop: 10 }} onClick={() => setMode("login")}>
                Kembali
              </button>
            </form>
          )}
        </div>
      </main>
      <footer className="foot">Otoko Coffee Rewards &mdash; prototype demo</footer>
    </div>
  );
}
