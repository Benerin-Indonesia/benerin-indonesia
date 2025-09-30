import React, { FC, PropsWithChildren, useEffect, useRef, useState } from "react";
import { Head, Link } from "@inertiajs/react";

/* ========= Palet warna & util ========= */
const PRIMARY = "#206BB0";

/* ========= Komponen util (sama dengan home.tsx) ========= */
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

/* ========= Halaman Privasi ========= */
export default function PrivacyPage() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* CSS ringan untuk animasi & smooth scroll */}
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

      <Head title="Kebijakan Privasi — Benerin Indonesia" />

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

            {/* Nav */}
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

        {/* ========= MAIN: 1 card saja ========= */}
        <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Kebijakan Privasi</h1>
            <p className="mt-2 text-sm text-gray-600">
              Terakhir diperbarui:{" "}
              {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
            </p>

            <div className="mt-6 space-y-6">
              {/* 1. Pendahuluan */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900">1. Pendahuluan</h2>
                <p className="mt-2 text-gray-700">
                  Kebijakan Privasi ini menjelaskan bagaimana <strong>Benerin Indonesia</strong> (“kami”) mengumpulkan,
                  menggunakan, menyimpan, melindungi, dan membagikan data pribadi saat Anda menggunakan platform kami.
                </p>
              </section>

              {/* 2. Data yang Kami Kumpulkan */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900">2. Data yang Kami Kumpulkan</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
                  <li><strong>Data Akun:</strong> nama, email, nomor telepon, foto (opsional), peran (user/teknisi/admin).</li>
                  <li><strong>Data Layanan:</strong> kategori, deskripsi permintaan, jadwal, foto keluhan, chat/penawaran.</li>
                  <li><strong>Data Pembayaran:</strong> jumlah, status transaksi, referensi penyedia (mis. Midtrans).</li>
                  <li><strong>Data Teknis:</strong> log akses dasar, perangkat, dan cookie (lihat bagian Cookie).</li>
                </ul>
              </section>

              {/* 3. Cara Kami Menggunakan Data */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900">3. Cara Kami Menggunakan Data</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
                  <li>Menyediakan dan mengoperasikan fitur platform (akun, permintaan, chat, pembayaran).</li>
                  <li>Verifikasi, pencegahan penipuan, dan keamanan sistem.</li>
                  <li>Dukungan pelanggan dan komunikasi terkait layanan.</li>
                  <li>Penyempurnaan produk (analitik agregat & anonimisasi bila memungkinkan).</li>
                </ul>
              </section>

              {/* 4. Dasar Hukum Pemrosesan */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900">4. Dasar Hukum Pemrosesan</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
                  <li>Pelaksanaan kontrak (memberikan layanan sesuai ketentuan).</li>
                  <li>Kepatuhan hukum (permintaan otoritas yang sah).</li>
                  <li>Kepentingan sah (meningkatkan keamanan dan pengalaman pengguna).</li>
                  <li>Persetujuan (untuk aktivitas tertentu; dapat Anda cabut sewaktu-waktu).</li>
                </ul>
              </section>

              {/* 5. Berbagi Data */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900">5. Berbagi Data</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
                  <li><strong>Penyedia Pembayaran:</strong> misalnya Midtrans untuk pemrosesan transaksi.</li>
                  <li><strong>Teknisi:</strong> data relevan untuk menjalankan permintaan layanan yang Anda buat.</li>
                  <li><strong>Penyedia Infrastruktur:</strong> penyimpanan/hosting, email, dan layanan pendukung lain.</li>
                  <li><strong>Penegak Hukum/Regulator:</strong> jika diwajibkan oleh hukum atau putusan yang sah.</li>
                </ul>
              </section>

              {/* 6. Penyimpanan & Retensi */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900">6. Penyimpanan & Retensi</h2>
                <p className="mt-2 text-gray-700">
                  Data disimpan selama diperlukan untuk tujuan yang dijelaskan atau sebagaimana disyaratkan oleh hukum.
                  Setelah tidak diperlukan, data akan dihapus, dianonimkan, atau diarsipkan secara aman.
                </p>
              </section>

              {/* 7. Keamanan */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900">7. Keamanan</h2>
                <p className="mt-2 text-gray-700">
                  Kami menerapkan langkah-langkah teknis dan organisasi yang wajar untuk melindungi data dari akses
                  tidak sah, pengungkapan, perubahan, atau penghancuran.
                </p>
              </section>

              {/* 8. Hak Pengguna */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900">8. Hak Anda</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
                  <li>Akses, perbaikan, atau penghapusan data tertentu.</li>
                  <li>Menarik persetujuan untuk aktivitas yang bergantung pada persetujuan.</li>
                  <li>Keberatan atau pembatasan pemrosesan dalam kondisi tertentu.</li>
                  <li>Portabilitas data (bila berlaku).</li>
                </ul>
              </section>

              {/* 9. Cookie & Teknologi Serupa */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900">9. Cookie & Teknologi Serupa</h2>
                <p className="mt-2 text-gray-700">
                  Kami dapat menggunakan cookie untuk menjaga sesi login, preferensi, dan analitik agregat. Anda dapat
                  mengatur peramban untuk menolak cookie, namun beberapa fitur mungkin tidak berfungsi optimal.
                </p>
              </section>

              {/* 10. Anak-Anak */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900">10. Anak-Anak</h2>
                <p className="mt-2 text-gray-700">
                  Platform tidak ditujukan untuk anak-anak di bawah usia yang disyaratkan hukum setempat. Kami tidak
                  dengan sengaja mengumpulkan data anak tanpa persetujuan yang sah.
                </p>
              </section>

              {/* 11. Transfer Internasional (opsional/jika berlaku) */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900">11. Transfer Internasional</h2>
                <p className="mt-2 text-gray-700">
                  Jika data diproses di luar negara Anda, kami akan mengambil langkah-langkah wajar untuk memastikan
                  tingkat perlindungan yang setara sesuai standar yang berlaku.
                </p>
              </section>

              {/* 12. Perubahan Kebijakan */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900">12. Perubahan Kebijakan</h2>
                <p className="mt-2 text-gray-700">
                  Kami dapat memperbarui kebijakan ini. Versi terbaru akan dipublikasikan di halaman ini.
                </p>
              </section>
            </div>
          </div>
        </main>

        {/* ========= FOOTER (identik, dengan anchor kontak) ========= */}
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
                {/* arahkan ke footer alih-alih halaman /kontak */}
                <a href="#kontak-footer" className="text-gray-600 transition hover:text-gray-900">
                  Kontak
                </a>
              </nav>
            </Reveal>

            {/* Sosial Media */}
            <Reveal className="mt-8">
              <div
                id="kontak-footer"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
              >
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
