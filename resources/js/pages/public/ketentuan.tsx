import React, { FC, PropsWithChildren, useEffect, useRef, useState } from "react";
import { Head, Link } from "@inertiajs/react";

/* ========= Palet warna & util ========= */
const PRIMARY = "#206BB0";
// const SECONDARY = "#FFBD59";

/* ========= Komponen util sama seperti di home.tsx ========= */
type ContainerProps = PropsWithChildren<{ className?: string }>;
const Container: FC<ContainerProps> = ({ children, className = "" }) => (
  <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>
);

function useReveal<T extends HTMLElement>(opts?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("reveal-show");
          obs.unobserve(el);
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -10% 0px", ...(opts || {}) }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [opts]);
  return ref;
}

const Reveal: FC<PropsWithChildren<{ className?: string; delay?: number }>> = ({
  children,
  className = "",
  delay = 0,
}) => {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
};

/* ========= Halaman ========= */
export default function TermsPage() {
  // agar header efek bayangannya sama seperti home.tsx
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const sections: Array<{ id: string; title: string }> = [
    { id: "pendahuluan", title: "Pendahuluan" },
    { id: "definisi", title: "Definisi" },
    { id: "lingkup", title: "Lingkup Layanan" },
    { id: "akun", title: "Akun & Keamanan" },
    { id: "pemesanan", title: "Pemesanan & Proses Layanan" },
    { id: "pembayaran", title: "Pembayaran" },
    { id: "pembatalan", title: "Pembatalan & Refund" },
    { id: "garansi", title: "Garansi & Klaim" },
    { id: "larangan", title: "Perilaku Terlarang" },
    { id: "hki", title: "Kekayaan Intelektual" },
    { id: "batasan", title: "Batasan Tanggung Jawab" },
    { id: "privasi", title: "Privasi Data" },
    { id: "perubahan", title: "Perubahan Ketentuan" },
    { id: "hukum", title: "Hukum yang Berlaku & Sengketa" },
  ];

  return (
    <>
      {/* CSS ringan untuk animasi & smooth scroll (copy dari home.tsx) */}
      <style>{`
        html { scroll-behavior: smooth; }
        :root { --ease: cubic-bezier(.22,.8,.28,1); }
        .reveal { opacity: 0; transform: translateY(16px) scale(.98); will-change: opacity, transform, filter;
          transition: opacity .6s var(--ease), transform .6s var(--ease), filter .6s var(--ease);}
        .reveal-show { opacity: 1; transform: none; filter: none; }
        @media (prefers-reduced-motion: reduce) {
          .reveal, .reveal-show { transition: none !important; transform: none !important; }
          html { scroll-behavior: auto; }
        }
      `}</style>

      <Head title="Ketentuan Layanan — Benerin Indonesia" />

      <div className="min-h-screen bg-gray-50">
        {/* ========= HEADER (identik dengan home.tsx) ========= */}
        <header
          className={`sticky top-0 z-40 border-b border-gray-100 backdrop-blur transition-all duration-300 ${
            scrolled ? "bg-white/80 shadow-sm" : "bg-white/70"
          }`}
        >
          <Container className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Reveal className="flex items-center gap-2" delay={50}>
              <img
                src="/storage/assets/logo.png"
                alt="Benerin Indonesia"
                className="h-8 w-16 rounded object-contain sm:h-14 sm:w-24"
              />
            </Reveal>

            {/* Nav (tetap sama; anchor akan mengarah ke section pada landing jika berada di /) */}
            <nav className="hidden md:flex items-center gap-6 text-sm">
              {[
                ["/", "Home"],
                ["/#cara-kerja", "Cara Kerja"],
                ["/#keunggulan", "Keunggulan"],
                ["/#kategori", "Kategori"],
                ["/#faq", "FAQ"],
              ].map(([href, label], i) => (
                <a key={href} href={href} className="text-gray-600 hover:text-gray-900 transition-colors">
                  <Reveal delay={120 + i * 60}>{label}</Reveal>
                </a>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Reveal delay={180}>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition
                             hover:bg-gray-50 active:scale-[.98]"
                >
                  Masuk
                </Link>
              </Reveal>
              <Reveal delay={230}>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm
                             transition hover:shadow-md hover:brightness-105 active:scale-[.98]"
                  style={{ backgroundColor: PRIMARY }}
                >
                  Daftar
                </Link>
              </Reveal>
            </div>
          </Container>
        </header>

        {/* ========= MAIN (konten khusus ketentuan) ========= */}
        <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Ketentuan Layanan</h1>
            <p className="mt-2 text-sm text-gray-600">
              Terakhir diperbarui:{" "}
              {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
            </p>

            {/* TOC */}
            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="group inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-lg bg-gray-100 text-gray-700 transition group-hover:bg-gray-900 group-hover:text-white">
                    <i className="fas fa-chevron-right text-[11px]" />
                  </span>
                  {s.title}
                </a>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <section id="pendahuluan" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">1. Pendahuluan</h2>
              <p className="mt-2 text-gray-700">
                Selamat datang di <strong>Benerin Indonesia</strong>, platform perantara layanan perbaikan elektronik.
                Dengan mengakses atau menggunakan platform kami, Anda menyatakan telah membaca, memahami, dan menyetujui
                Ketentuan Layanan ini.
              </p>
            </section>

            <section id="definisi" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">2. Definisi</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
                <li><strong>Pengguna</strong>: pemilik perangkat yang memesan layanan.</li>
                <li><strong>Teknisi</strong>: penyedia jasa perbaikan/servis yang terdaftar.</li>
                <li><strong>Platform</strong>: situs/aplikasi Benerin Indonesia.</li>
                <li><strong>Permintaan Layanan</strong>: tiket/entri yang dibuat Pengguna untuk perbaikan.</li>
                <li><strong>Saldo Tertahan (hold)</strong>: nilai hasil pembayaran yang ditahan sementara sebelum dicairkan ke Teknisi.</li>
              </ul>
            </section>

            <section id="lingkup" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">3. Lingkup Layanan</h2>
              <p className="mt-2 text-gray-700">
                Platform mempertemukan Pengguna dengan Teknisi sesuai kategori (misalnya AC, TV, Kulkas, dll).
                Kami bukan pihak yang melakukan perbaikan secara langsung; tanggung jawab pekerjaan berada pada Teknisi.
              </p>
            </section>

            <section id="akun" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">4. Akun & Keamanan</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
                <li>Pengguna wajib memberikan data yang akurat dan menjaga kerahasiaan kredensial.</li>
                <li>Aktivitas pada akun menjadi tanggung jawab pemilik akun.</li>
                <li>Kami berhak menangguhkan/menutup akun yang melanggar ketentuan.</li>
              </ul>
            </section>

            <section id="pemesanan" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">5. Pemesanan & Proses Layanan</h2>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-gray-700">
                <li>Pengguna membuat permintaan (kategori, deskripsi, foto, jadwal opsional).</li>
                <li>Teknisi memberikan penawaran (harga & jadwal) melalui chat.</li>
                <li>Jika disetujui, status menjadi <em>dijadwalkan</em> atau <em>diproses</em>.</li>
                <li>Pekerjaan ditandai <em>selesai</em> setelah pengerjaan tuntas.</li>
              </ol>
            </section>

            <section id="pembayaran" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">6. Pembayaran</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
                <li>Pembayaran diproses melalui penyedia pembayaran (misalnya Midtrans Snap).</li>
                <li>Ketika transaksi <em>settled</em>, saldo Teknisi dicatat sebagai <strong>hold</strong> (tertahan).</li>
                <li>Biaya layanan/biaya platform (jika ada) dapat dipotong dari jumlah yang dibayarkan.</li>
              </ul>
            </section>

            <section id="pembatalan" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">7. Pembatalan & Refund</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
                <li>Pengajuan pembatalan tunduk pada status pekerjaan dan kebijakan masing-masing kasus.</li>
                <li>Jika pembayaran sudah <em>settled</em> dan disetujui refund, pengembalian dana dapat berupa:
                  kredit ke <em>wallet</em> Pengguna atau metode lain sesuai ketersediaan sistem.</li>
                <li>Pembatalan setelah pekerjaan berjalan dapat dikenakan potongan biaya.</li>
              </ul>
            </section>

            <section id="garansi" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">8. Garansi & Klaim</h2>
              <p className="mt-2 text-gray-700">
                Garansi (jika ada) ditentukan oleh Teknisi atau pihak ketiga terkait komponen yang digunakan. Pengguna
                wajib menyimpan bukti pekerjaan/komponen. Klaim garansi harus diajukan sesuai jangka waktu yang diinformasikan.
              </p>
            </section>

            <section id="larangan" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">9. Perilaku Terlarang</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
                <li>Memberikan informasi palsu, melakukan penipuan, atau merusak sistem.</li>
                <li>Pelecehan, ujaran kebencian, atau tindakan yang melanggar hukum.</li>
                <li>Mem-bypass proses pembayaran resmi di platform.</li>
              </ul>
            </section>

            <section id="hki" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">10. Kekayaan Intelektual</h2>
              <p className="mt-2 text-gray-700">
                Seluruh logo, merek, desain antarmuka, dan materi pada platform adalah milik Benerin Indonesia atau
                pemegang lisensi terkait. Dilarang menggunakan tanpa izin tertulis.
              </p>
            </section>

            <section id="batasan" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">11. Batasan Tanggung Jawab</h2>
              <p className="mt-2 text-gray-700">
                Platform disediakan sebagaimana adanya (<em>as is</em>). Sepanjang diizinkan hukum, Benerin Indonesia
                tidak bertanggung jawab atas kerugian tidak langsung/insidental yang timbul dari penggunaan layanan.
              </p>
            </section>

            <section id="privasi" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">12. Privasi Data</h2>
              <p className="mt-2 text-gray-700">
                Kami menghormati privasi Anda. Pengumpulan dan pemrosesan data diatur dalam Kebijakan Privasi terpisah.
                Silakan lihat halaman <Link href="/privasi" className="text-gray-900 underline">Privasi</Link>.
              </p>
            </section>

            <section id="perubahan" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">13. Perubahan Ketentuan</h2>
              <p className="mt-2 text-gray-700">
                Kami dapat memperbarui ketentuan ini sewaktu-waktu. Versi terbaru akan ditampilkan pada halaman ini.
              </p>
            </section>

            <section id="hukum" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">14. Hukum yang Berlaku & Sengketa</h2>
              <p className="mt-2 text-gray-700">
                Ketentuan ini tunduk pada hukum Republik Indonesia. Sengketa diupayakan diselesaikan secara musyawarah;
                jika gagal, maka melalui mekanisme hukum yang berlaku.
              </p>
            </section>

          </div>
        </main>

        {/* ========= FOOTER (identik dengan home.tsx) ========= */}
        <footer className="border-t border-gray-100">
          <Container className="py-10">
            {/* Baris logo + nav */}
            <Reveal className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <img
                  src="/storage/assets/logo.png"
                  alt="Benerin Indonesia"
                  className="h-24 w-48 rounded object-contain"
                />
              </div>
              <nav className="flex gap-6 text-sm">
                <Link href="/ketentuan" className="text-gray-600 transition hover:text-gray-900">
                  Ketentuan
                </Link>
                <Link href="/privasi" className="text-gray-600 transition hover:text-gray-900">
                  Privasi
                </Link>
                <Link href="#kontak-footer" className="text-gray-600 transition hover:text-gray-900">
                  Kontak
                </Link>
              </nav>
            </Reveal>

            {/* Sosial Media */}
            <Reveal className="mt-8">
              <div id="kontak-footer"className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {/* WhatsApp */}
                <a
                  href="https://wa.me/6287721149863"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700 transition hover:-translate-y-0.5 hover:shadow-sm"
                  aria-label="WhatsApp Benerin Indonesia"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-green-600">
                    <path
                      fill="currentColor"
                      d="M20.5 3.5A11 11 0 0 0 3.1 18.7L2 22l3.4-1.1A11 11 0 0 0 12 23a11 11 0 0 0 8.5-19.5ZM12 21a9 9 0 0 1-4.6-1.3l-.3-.2-2.7.9.9-2.6-.2-.3A9 9 0 1 1 21 12a9 9 0 0 1-9 9Zm4.8-6.4c-.3-.2-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.3 7.3 0 0 1-3.6-3.1c-.3-.6.3-.5.8-1.4l.2-.4c.1-.1 0-.3 0-.5s-.5-1.3-.7-1.8-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 2.3 2.3 0 0 0-.7 1.7c0 1 0 2 .9 3.1a13 13 0 0 0 5 4.3 5.2 5.2 0 0 0 3.2.8 2.7 2.7 0 0 0 1.8-1.2c.2-.3.2-1 .1-1.1s-.3-.2-.6-.4Z"
                    />
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">WhatsApp</span>
                    <span className="font-semibold">0877-2114-9863</span>
                  </div>
                </a>

                {/* Instagram */}
                <a
                  href="https://instagram.com/benerin.indonesia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700 transition hover:-translate-y-0.5 hover:shadow-sm"
                  aria-label="Instagram Benerin Indonesia"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-pink-600">
                    <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Instagram</span>
                    <span className="font-semibold">@benerin.indonesia</span>
                  </div>
                </a>

                {/* TikTok */}
                <a
                  href="https://www.tiktok.com/@benerin.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700 transition hover:-translate-y-0.5 hover:shadow-sm"
                  aria-label="TikTok Benerin Indonesia"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-gray-900">
                    <path
                      fill="currentColor"
                      d="M14.5 3h2.2a5.8 5.8 0 0 0 3.7 3.6v2.1a7.8 7.8 0 0 1-3.7-1.2v6.6a5.6 5.6 0 1 1-5.6-5.6c.3 0 .7 0 1 .1V11a3.3 3.3 0 1 0 2.3 3.1V3Z"
                    />
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">TikTok</span>
                    <span className="font-semibold">@benerin.co</span>
                  </div>
                </a>

                {/* Email */}
                <a
                  href="mailto:benerin814@gmail.com"
                  className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700 transition hover:-translate-y-0.5 hover:shadow-sm"
                  aria-label="Email Benerin Indonesia"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-blue-600">
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
                    />
                    <path fill="none" stroke="currentColor" strokeWidth="2" d="m22 8-10 7L2 8" />
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Email</span>
                    <span className="font-semibold">benerin814@gmail.com</span>
                  </div>
                </a>

                {/* Facebook */}
                <a
                  href="https://facebook.com/benerinaja"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700 transition hover:-translate-y-0.5 hover:shadow-sm"
                  aria-label="Facebook Benerin Indonesia"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-[#1877F2]">
                    <path
                      fill="currentColor"
                      d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2.7V12h2.7V9.7c0-2.7 1.6-4.2 4-4.2 1.2 0 2.5.2 2.5.2v2.7h-1.4c-1.4 0-1.8.9-1.8 1.8V12h3.1l-.5 2.9h-2.6v7A10 10 0 0 0 22 12Z"
                    />
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Facebook</span>
                    <span className="font-semibold">Benerin Aja</span>
                  </div>
                </a>
              </div>
            </Reveal>

            <div className="mt-6 text-xs text-gray-500">
              © {new Date().getFullYear()} Benerin Indonesia. Semua hak cipta dilindungi.
            </div>
          </Container>
        </footer>
      </div>
    </>
  );
}
