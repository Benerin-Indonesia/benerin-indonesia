import React, { type FC, type PropsWithChildren, useEffect, useRef, useState } from "react";
import { Head, Link } from "@inertiajs/react";

// Palet warna
const PRIMARY = "#206BB0";
const SECONDARY = "#FFBD59";

// ==== Types ====
type ContainerProps = PropsWithChildren<{ className?: string }>;
type IconProps = React.SVGProps<SVGSVGElement>;

// Komponen kecil
const Container: FC<ContainerProps> = ({ children, className = "" }) => (
  <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>
);

const Star: FC<IconProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" />
  </svg>
);

const Check: FC<IconProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const Shield: FC<IconProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const Message: FC<IconProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V5a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
  </svg>
);

const Wallet: FC<IconProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M16 5V3H4a1 1 0 0 0-1 1v1" />
    <path d="M21 12h-5a2 2 0 1 0 0 4h5z" />
  </svg>
);

const Truck: FC<IconProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M10 17h4V5H2v12h2M15 8h4l3 3v6h-2" />
    <circle cx="7.5" cy="17.5" r="2.5" />
    <circle cx="18.5" cy="17.5" r="2.5" />
  </svg>
);

// Kategori + gambar (pastikan file ada di /storage/assets/categories/...)
const CATEGORIES = [
  { name: "AC", slug: "ac", img: "/storage/assets/categories/ac.png" },
  { name: "TV", slug: "tv", img: "/storage/assets/categories/tv.png" },
  { name: "Kulkas", slug: "kulkas", img: "/storage/assets/categories/kulkas.png" },
  { name: "Mesin Cuci", slug: "mesin-cuci", img: "/storage/assets/categories/mesin-cuci.png" },
] as const;

/* =========================
   Animasi tanpa library
   ========================= */

// Hook: tambahkan kelas 'reveal-show' saat elemen masuk viewport
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

// Komponen pembungkus untuk animasi reveal (tanpa `any`, tanpa `JSX` namespace)
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

export default function Landing() {
  // Header shadow saat scroll
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
        /* Reveal dasar */
        .reveal { opacity: 0; transform: translateY(16px) scale(.98); will-change: opacity, transform, filter;
          transition: opacity .6s var(--ease), transform .6s var(--ease), filter .6s var(--ease);}
        .reveal-show { opacity: 1; transform: none; filter: none; }
        /* Animasi blob latar */
        @keyframes float {
          0%{ transform: translateY(0) }
          50%{ transform: translateY(-8px) }
          100%{ transform: translateY(0) }
        }
        .animate-float-slow { animation: float 10s ease-in-out infinite; }
        .animate-float-slower { animation: float 14s ease-in-out infinite; }
        /* Hormati preferensi aksesibilitas */
        @media (prefers-reduced-motion: reduce) {
          .reveal, .reveal-show { transition: none !important; transform: none !important; }
          .animate-float-slow, .animate-float-slower { animation: none !important; }
          html { scroll-behavior: auto; }
        }
      `}</style>

      <Head title="Benerin Indonesia — Temukan Teknisi Elektronik Terdekat" />

      {/* HEADER */}
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
              ["#home", "Home"],
              ["#cara-kerja", "Cara Kerja"],
              ["#keunggulan", "Keunggulan"],
              ["#kategori", "Kategori"],
              ["#faq", "FAQ"],
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
                href="/u/permintaan/buat"
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm
                           transition hover:shadow-md hover:brightness-105 active:scale-[.98]"
                style={{ backgroundColor: PRIMARY }}
              >
                Buat Permintaan
              </Link>
            </Reveal>
          </div>
        </Container>
      </header>

      {/* MAIN */}
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10" aria-hidden="true">
            <div
              className="absolute -top-32 -right-24 h-72 w-72 rounded-full blur-3xl opacity-30 animate-float-slow"
              style={{ backgroundColor: SECONDARY }}
            />
            <div
              className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full blur-3xl opacity-20 animate-float-slower"
              style={{ backgroundColor: PRIMARY }}
            />
          </div>

          <Container className="py-16 sm:py-24">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
              <Reveal>
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                  Benerin elektronik jadi mudah.
                  <span className="block" style={{ color: PRIMARY }}>
                    Temukan teknisi tepercaya dekat Anda.
                  </span>
                </h1>

                <Reveal delay={80} className="mt-4 max-w-xl text-base text-gray-600 sm:text-lg">
                  Platform perantara untuk mempertemukan Anda dengan teknisi elektronik (AC, TV,
                  kulkas, mesin cuci, dan lainnya). Pembayaran melalui platform—teknisi menerima
                  setelah pekerjaan selesai. Aman, transparan, dan terlacak.
                </Reveal>

                <Reveal delay={140}>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/u/permintaan/buat"
                      className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm
                                 transition hover:shadow-md hover:brightness-105 active:scale-[.98] sm:text-base"
                      style={{ backgroundColor: PRIMARY }}
                    >
                      Buat Permintaan
                    </Link>
                    <Link
                      href="/register?role=technician"
                      className="inline-flex items-center justify-center rounded-xl border px-5 py-3 text-sm font-semibold text-gray-900
                                 transition hover:bg-gray-50 active:scale-[.98] sm:text-base"
                      style={{ borderColor: PRIMARY }}
                    >
                      Daftar jadi Teknisi
                    </Link>
                  </div>
                </Reveal>

                <Reveal delay={200}>
                  <div className="mt-6 flex items-center gap-2 text-sm text-gray-600">
                    <div className="flex items-center" aria-hidden="true">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4" style={{ color: SECONDARY }} />
                      ))}
                    </div>
                    <span>4.9/5 dari 1.240+ pelanggan</span>
                  </div>
                </Reveal>
              </Reveal>

              {/* Ilustrasi placeholder */}
              <Reveal delay={120}>
                <div className="relative">
                  <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-gray-200 bg-white/70
                                  backdrop-blur shadow-sm transition hover:shadow-md">
                    <div className="p-6 text-center">
                      <div className="text-sm uppercase tracking-widest text-gray-500">Ilustrasi</div>
                      <div className="mt-2 text-lg font-semibold">
                        Pembayaran Aman • Chat • Penawaran • Tracking
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-lg border p-3 text-left transition hover:shadow-sm hover:-translate-y-0.5">
                          <Shield className="mb-1 h-5 w-5" style={{ color: PRIMARY }} />
                          Pembayaran Aman
                        </div>
                        <div className="rounded-lg border p-3 text-left transition hover:shadow-sm hover:-translate-y-0.5">
                          <Message className="mb-1 h-5 w-5" style={{ color: PRIMARY }} />
                          Chat & Negosiasi
                        </div>
                        <div className="rounded-lg border p-3 text-left transition hover:shadow-sm hover:-translate-y-0.5">
                          <Wallet className="mb-1 h-5 w-5" style={{ color: PRIMARY }} />
                          Perantara Tepercaya
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* CARA KERJA */}
        <section id="cara-kerja" className="py-16 sm:py-20">
          <Container>
            <Reveal className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Cara Kerja (3 Langkah)</h2>
              <p className="mt-2 text-gray-600">Cepat, transparan, dan tanpa ribet.</p>
            </Reveal>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                {
                  title: "Buat permintaan",
                  desc: "Isi keluhan & jadwal—kami cocokkan dengan teknisi yang sesuai.",
                  icon: <Message className="h-6 w-6" />,
                },
                {
                  title: "Dapat penawaran & bayar di platform",
                  desc: "Setujui penawaran, lalu bayar melalui platform untuk keamanan transaksi.",
                  icon: <Wallet className="h-6 w-6" />,
                },
                {
                  title: "Teknisi mengerjakan & dana diteruskan",
                  desc: "Setelah pekerjaan selesai & disetujui, pembayaran diteruskan ke teknisi.",
                  icon: <Truck className="h-6 w-6" />,
                },
              ].map((s, idx) => (
                <Reveal
                  key={s.title}
                  delay={idx * 120}
                  className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition
                             hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: PRIMARY }}
                    >
                      {s.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {idx + 1}. {s.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">{s.desc}</p>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>

        {/* KEUNGGULAN */}
        <section id="keunggulan" className="bg-gray-50 py-16 sm:py-20">
          <Container>
            <Reveal className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Keunggulan</h2>
              <p className="mt-2 text-gray-600">Fitur inti yang bikin aman & nyaman.</p>
            </Reveal>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                {
                  title: "Pembayaran aman",
                  desc: "Transaksi melalui platform; data dan dana Anda lebih terlindungi.",
                  icon: <Shield className="h-6 w-6" />,
                },
                {
                  title: "Chat & penawaran transparan",
                  desc: "Semua diskusi & rincian biaya tercatat rapi dan bisa ditinjau kembali.",
                  icon: <Message className="h-6 w-6" />,
                },
                {
                  title: "Riwayat & garansi layanan",
                  desc: "Jejak servis tersimpan—mudah klaim garansi (opsional kebijakan).",
                  icon: <Check className="h-6 w-6" />,
                },
              ].map((f, idx) => (
                <Reveal
                  key={f.title}
                  delay={idx * 120}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition
                             hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: SECONDARY, color: "#000" }}
                    >
                      {f.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{f.title}</h3>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">{f.desc}</p>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>

        {/* KATEGORI POPULER */}
        <section id="kategori" className="py-16 sm:py-20">
          <Container>
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Kategori Populer</h2>
                <p className="mt-2 text-gray-600">Langsung pilih kebutuhan Anda.</p>
              </div>
              <Link href="/u/permintaan/buat" className="text-sm font-semibold hover:underline" style={{ color: PRIMARY }}>
                Buat Permintaan →
              </Link>
            </Reveal>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {CATEGORIES.map((c, i) => (
                <Reveal
                  key={c.slug}
                  delay={i * 100}
                  className="group rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm transition
                             hover:-translate-y-1 hover:shadow-md hover:scale-[1.02] active:scale-[.99]"
                >
                  <Link href={`/u/permintaan/buat?category=${c.slug}`} className="block">
                    <div className="mx-auto aspect-square w-20 sm:w-24 rounded-xl bg-gray-50 border flex items-center justify-center overflow-hidden">
                      <img src={c.img} alt={c.name} className="h-16 w-16 object-contain sm:h-20 sm:w-20 transition duration-300 group-hover:scale-105" />
                    </div>
                    <div className="mt-3 text-sm font-semibold text-gray-900">{c.name}</div>
                    <div className="mt-1 text-xs text-gray-600">Servis & perbaikan</div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>

        {/* TESTIMONI */}
        <section className="bg-gray-50 py-16 sm:py-20">
          <Container>
            <Reveal className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Apa kata pelanggan</h2>
              <p className="mt-2 text-gray-600">Testimoni singkat (placeholder).</p>
            </Reveal>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Reveal key={i} delay={i * 100} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                  <div className="flex items-center gap-1" aria-hidden="true">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className="h-4 w-4" style={{ color: SECONDARY }} />
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-gray-700">“Prosesnya gampang, teknisi ramah, dan pembayaran aman lewat platform.”</p>
                  <div className="mt-4 text-sm font-semibold">Andi Pratama</div>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-16 sm:py-20">
          <Container>
            <Reveal className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">FAQ</h2>
              <p className="mt-2 text-gray-600">Pertanyaan umum tentang transaksi, keamanan, dan pembayaran.</p>
            </Reveal>

            <div className="mt-8 space-y-4">
              {[
                { q: "Bagaimana keamanan transaksinya?", a: "Pembayaran dilakukan di platform. Dana diteruskan ke teknisi setelah pekerjaan selesai dan disetujui." },
                { q: "Metode pembayaran apa yang didukung?", a: "VA, QRIS, e-wallet, kartu kredit, dan bank transfer (via penyedia pembayaran terintegrasi)." },
                { q: "Bagaimana jika pekerjaan tidak sesuai?", a: "Anda bisa membuka komplain. Tim kami menengahi hingga ada penyelesaian yang adil." },
                { q: "Apakah ada garansi layanan?", a: "Garansi bersifat opsional sesuai kebijakan teknisi/platform dan tercatat pada riwayat servis." },
              ].map((f, idx) => (
                <Reveal key={f.q} delay={idx * 80}>
                  <details className="group rounded-2xl border border-gray-200 bg-white p-5 open:shadow-sm transition">
                    <summary className="flex cursor-pointer items-center justify-between text-left">
                      <span className="text-sm font-semibold text-gray-900 sm:text-base">{f.q}</span>
                      <span className="ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-gray-500 transition group-open:rotate-45" style={{ borderColor: PRIMARY }} aria-hidden="true">
                        <span className="block h-3 w-3 rotate-45 border-l-2 border-t-2" style={{ borderColor: PRIMARY }} />
                      </span>
                    </summary>
                    <p className="mt-3 text-sm text-gray-600">{f.a}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>

        {/* CTA STRIP */}
        <section className="py-10">
          <Container>
            <Reveal className="flex flex-col items-center justify-between gap-4 rounded-2xl p-6 text-white shadow-sm transition md:flex-row" >
              <div>
                <h3 className="text-lg font-bold sm:text-xl">Siap benerin perangkat?</h3>
                <p className="mt-1 text-sm text-white/90">Buat permintaan sekarang, teknisi siap membantu.</p>
              </div>
              <div className="flex gap-3">
                <Link href="/u/permintaan/buat" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-white/90 active:scale-[.98]">
                  Buat Permintaan
                </Link>
                <Link href="/register?role=technician" className="rounded-xl border px-4 py-2 text-sm font-semibold transition hover:bg-white/10 active:scale-[.98]" style={{ borderColor: SECONDARY, color: SECONDARY }}>
                  Daftar Teknisi
                </Link>
              </div>
            </Reveal>
            {/* warna latar CTA di-inline agar tidak ikut transisi reveal */}
            <style>{`
              section:has(.text-white.shadow-sm) .rounded-2xl.p-6 { background-color: ${PRIMARY}; }
              @supports not (selector(:has(*))) { /* fallback: langsung inline di elemen jika perlu */ }
            `}</style>
          </Container>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-gray-100">
        <Container className="py-10">
          <Reveal className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <img src="/storage/assets/logo.png" alt="Benerin Indonesia" className="h-24 w-48 rounded object-contain" />
            </div>
            <nav className="flex gap-6 text-sm">
              <Link href="/ketentuan" className="text-gray-600 transition hover:text-gray-900">Ketentuan</Link>
              <Link href="/privasi" className="text-gray-600 transition hover:text-gray-900">Privasi</Link>
              <Link href="/kontak" className="text-gray-600 transition hover:text-gray-900">Kontak</Link>
            </nav>
          </Reveal>
          <div className="mt-6 text-xs text-gray-500">© {new Date().getFullYear()} Benerin Indonesia. Semua hak cipta dilindungi.</div>
        </Container>
      </footer>
    </>
  );
}
