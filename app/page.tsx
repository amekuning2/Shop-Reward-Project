import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="page">
      <header className="topbar">
        <div className="container-wide topbar-inner">
          <Link href="/">
            <Image src="/otoko_blue.png" alt="Otoko Coffee" className="topbar-logo" width={120} height={36} style={{ objectFit: "contain" }} />
          </Link>
          <span className="tag">Member Rewards</span>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center" }}>
        <div className="container-wide" style={{ padding: "80px 32px" }}>
          <div className="kanji-divider">精神 &nbsp; Spirit</div>
          <p className="eyebrow">Prototype &mdash; Opsi A (Manual Input)</p>
          <h1 className="display" style={{ fontSize: "3rem", maxWidth: 580, margin: "0 0 16px", lineHeight: 1.15 }}>
            Satu cangkir lebih dekat ke reward selanjutnya.
          </h1>
          <p className="muted" style={{ maxWidth: 480, marginBottom: 40, fontSize: "0.95rem", lineHeight: 1.7 }}>
            Setiap Rp10.000 belanja di Otoko Coffee = 1 poin. Kumpulkan poin,
            tukar jadi kopi gratis, pastry, dan diskon.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, maxWidth: 600 }}>
            <Link href="/member" style={{ textDecoration: "none" }}>
              <div className="card" style={{ height: "100%" }}>
                <p className="eyebrow">Untuk Pelanggan</p>
                <h3 style={{ margin: "0 0 10px", fontSize: "1.5rem" }}>Member Portal</h3>
                <p className="muted" style={{ margin: "0 0 20px", lineHeight: 1.6 }}>
                  Cek poin, lihat progres stamp, dan tukar reward.
                </p>
                <span className="btn btn-primary btn-sm">Masuk sebagai Member &rarr;</span>
              </div>
            </Link>

            <Link href="/admin" style={{ textDecoration: "none" }}>
              <div className="card" style={{ height: "100%" }}>
                <p className="eyebrow">Untuk Staf</p>
                <h3 style={{ margin: "0 0 10px", fontSize: "1.5rem" }}>Kasir / Admin</h3>
                <p className="muted" style={{ margin: "0 0 20px", lineHeight: 1.6 }}>
                  Input transaksi, kelola member &amp; katalog reward.
                </p>
                <span className="btn btn-outline btn-sm">Buka Dashboard Kasir &rarr;</span>
              </div>
            </Link>
          </div>
        </div>
      </main>

      <footer className="foot">Otoko Coffee Rewards &mdash; prototype demo</footer>
    </div>
  );
}
