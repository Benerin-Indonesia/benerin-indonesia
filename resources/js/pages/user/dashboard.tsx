import React, { useState, useEffect, PropsWithChildren } from "react";
import { Head, Link, usePage } from "@inertiajs/react";

// --- COLOR PALETTE ---
const PRIMARY = "#206BB0";

// --- TYPE DEFINITIONS (Unchanged) ---
type AuthUser = { id: number; name: string; email: string; role: string };
type Category = { slug: string; name: string; icon: string; hint: string };
type RequestItem = {
  id: number;
  title: string;
  category: string;
  scheduled_for?: string | null;
  status: "menunggu" | "diproses" | "dijadwalkan" | "selesai" | "dibatalkan";
  price_offer?: number | null; // <-- TAMBAHKAN BARIS INI
};
type PageProps = {
  auth?: { user: AuthUser | null };
  stats?: { active: number; scheduled: number; completed: number };
  recent?: RequestItem[];
  categories: Category[];
};

// --- HELPER COMPONENT: Status Badge (Unchanged) ---
function StatusBadge({ status }: { status: RequestItem["status"] }) {
  const statusMap: Record<RequestItem["status"], { text: string; cls: string }> = {
    menunggu: { text: "Menunggu", cls: "bg-gray-100 text-gray-800" },
    diproses: { text: "Diproses", cls: "bg-amber-100 text-amber-800" },
    dijadwalkan: { text: "Dijadwalkan", cls: `bg-blue-100 text-blue-800` },
    selesai: { text: "Selesai", cls: "bg-green-100 text-green-800" },
    dibatalkan: { text: "Dibatalkan", cls: "bg-red-100 text-red-800" },
  };
  const { text, cls } = statusMap[status];

  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {text}
    </span>
  );
}

// --- NEW COMPONENT: Application Layout with Responsive Navbar ---
function AppLayout({ user, children }: PropsWithChildren<{ user: AuthUser | null }>) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const initial = user?.name.charAt(0).toUpperCase() ?? 'U';

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* --- TOP NAVIGATION BAR (For Desktop & Mobile) --- */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo / Brand Name */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-2 text-xl font-bold" style={{ color: PRIMARY }}>
                <img
                  src="/storage/assets/logo.png"
                  alt="Benerin Indonesia"
                  className="w-[150px] rounded object-contain"
                />
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex md:items-center md:gap-x-8">
              <Link href="/user/home" className="flex items-center gap-2 text-sm font-semibold transition" style={{ color: PRIMARY }}>
                <i className="fas fa-home" /> Beranda
              </Link>
              <Link href="/user/permintaan" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition">
                <i className="fas fa-clipboard-list" /> Permintaan
              </Link>
              <Link href="/user/refund" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition">
                <i className="fas fa-hand-holding-usd" /> Refund
              </Link>
            </nav>

            {/* Profile Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                onBlur={() => setTimeout(() => setIsProfileMenuOpen(false), 150)} // Close on blur
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ '--tw-ring-color': PRIMARY } as React.CSSProperties}
              >
                {initial}
              </button>
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <Link href="/user/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                    <i className="fas fa-user-edit w-6 mr-1"></i> Profil Saya
                  </Link>
                  {/* <Link href="/user/wallet" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><i className="fas fa-wallet w-6 mr-1"></i> Wallet & Saldo</Link> */}
                  {/* --- [BARU] --- Menu Refund di Dropdown Profil */}
                  <Link href="/user/refund" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><i className="fas fa-hand-holding-usd w-6 mr-1"></i> Refund</Link>
                  <Link href="/logout" method="post" as="button" className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <i className="fas fa-sign-out-alt w-6 mr-1"></i> Keluar
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main>{children}</main>

      {/* --- BOTTOM NAVIGATION BAR (Mobile Only) --- */}
      <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-t-lg z-30">
        {/* --- [MODIFIKASI] --- Mengubah grid menjadi 4 kolom --- */}
        <nav className="grid grid-cols-4 h-16">
          <Link href="/user/home" className="flex flex-col items-center justify-center gap-1 text-xs font-medium" style={{ color: PRIMARY }}>
            <i className="fas fa-home text-xl"></i>
            <span>Beranda</span>
          </Link>
          <Link href="/user/permintaan" className="flex flex-col items-center justify-center gap-1 text-xs font-medium text-gray-600 hover:text-blue-600">
            <i className="fas fa-clipboard-list text-xl"></i>
            <span>Permintaan</span>
          </Link>
          {/* --- [BARU] --- Menu Refund di Navigasi Bawah (Mobile) */}
          <Link href="/user/refund" className="flex flex-col items-center justify-center gap-1 text-xs font-medium text-gray-600 hover:text-blue-600">
            <i className="fas fa-hand-holding-usd text-xl"></i>
            <span>Refund</span>
          </Link>
          <Link href="/user/profile" className="flex flex-col items-center justify-center gap-1 text-xs font-medium text-gray-600 hover:text-blue-600">
            <i className="fas fa-user-circle text-xl"></i>
            <span>Profil</span>
          </Link>
        </nav>
      </footer>

      {/* Spacer to prevent content from being hidden behind the bottom nav */}
      <div className="h-16 md:hidden"></div>
    </div>
  );
}


// --- MAIN COMPONENT: UserDashboard ---
export default function UserDashboard() {
  const { auth, stats, recent, categories } = usePage<PageProps>().props;

  // --- DATA HANDLING (Unchanged) ---
  const name = auth?.user?.name ?? "Pengguna";
  const statsData = stats ?? { active: 0, scheduled: 0, completed: 0 };
  const recentData = recent ?? [];
  const categoriesData = categories ?? [];

  // --- ANIMATION EFFECT
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    const prepare = (el: HTMLElement) => el.classList.add("reveal-prepare");
    const show = (el: HTMLElement) => el.classList.add("show");
    elements.forEach(prepare);

    if ("IntersectionObserver" in window) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            show(entry.target as HTMLElement);
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      elements.forEach((el) => obs.observe(el));
      return () => obs.disconnect();
    } else {
      elements.forEach(show);
    }
  }, []);

  const formatRupiah = (angka) => {
    // Cek jika angka null atau undefined untuk menghindari error
    if (angka === null || angka === undefined) {
      return "Rp 0"; // Atau bisa juga return "" (string kosong)
    }

    // Format angka ke mata uang Rupiah
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0, // Menghilangkan angka desimal ,00
      maximumFractionDigits: 0
    }).format(angka);
  };

  return (
    <AppLayout user={auth?.user ?? null}>
      <Head title={`Dashboard | ${name}`} />

      {/* --- STYLES FOR ANIMATION (Unchanged) --- */}
      <style>{`
        :root { --ease: cubic-bezier(.22,.8,.28,1); }
        .reveal { transition: all .6s var(--ease); }
        .reveal-prepare { opacity: 0; transform: translateY(20px); }
        .reveal-prepare.show { opacity: 1; transform: none; }
        @media (prefers-reduced-motion: reduce) {
          .reveal, .reveal-prepare, .reveal-prepare.show { transition: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
      <noscript>{`<style>.reveal { opacity: 1 !important; transform: none !important; }</style>`}</noscript>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* --- HEADER --- */}
        <header className="reveal">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Halo, {name.split(" ")[0]}! 👋
          </h1>
          <p className="mt-1 text-lg text-gray-600">
            Selamat datang kembali. Siap memperbaiki sesuatu hari ini?
          </p>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* --- MAIN CONTENT (LEFT/TOP) --- */}
          <div className="flex flex-col gap-8 lg:col-span-2">
            {/* Quick Start Section (Unchanged) */}
            <section className="reveal rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
              {/* ... (isi section ini sama seperti kode sebelumnya) ... */}
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Mulai Cepat</h2>
                  <p className="mt-1 text-sm text-gray-600">Pilih kategori untuk membuat permintaan servis baru.</p>
                </div>
                <Link
                  href="/user/permintaan/buat"
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform duration-200 ease-in-out hover:scale-[1.02] hover:shadow-md"
                  style={{ backgroundColor: PRIMARY }}
                >
                  <i className="fas fa-plus text-xs" /> Buat Permintaan Baru
                </Link>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4 mb-3">
                {categoriesData.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/user/permintaan/buat?category=${encodeURIComponent(c.slug)}`}
                    className="group flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50 p-4 text-center transition duration-200 hover:border-blue-300 hover:bg-white hover:shadow-lg">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm transition duration-200 group-hover:bg-blue-50">
                      <img
                        src={c.icon}
                        alt={c.name}
                        className="h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>

                    <span className="mt-4 block text-sm font-semibold text-gray-800">{c.name}</span>
                    <span className="text-xs text-gray-500">{c.hint}</span>
                  </Link>
                ))}
              </div>
              <Link href="/user/categories" className="text-sm ml-2.5 font-semibold hover:underline" style={{ color: PRIMARY }}>
                Lihat Semua Kategori
              </Link>
            </section>

            {/* Recent Requests Section (with updated buttons) */}
            <section className="reveal" style={{ '--delay': '250ms' }}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Permintaan Terakhir Anda</h2>
                <Link href="/user/permintaan" className="text-sm font-semibold hover:underline" style={{ color: PRIMARY }}>
                  Lihat Semua
                </Link>
              </div>
              <div className="mt-4 flow-root">
                <div className="-my-4 divide-y divide-gray-200/80">
                  {recentData.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
                      <i className="fas fa-file-alt fa-2x mx-auto text-gray-400"></i>
                      <p className="mt-4 font-semibold text-gray-800">Belum Ada Permintaan</p>
                      <p className="mt-1 text-sm text-gray-500">
                        Mulai dengan <Link href="/user/permintaan/buat" className="font-medium hover:underline" style={{ color: PRIMARY }}>membuat permintaan baru</Link>.
                      </p>
                    </div>
                  ) : (
                    recentData.map((r) => (
                      <div
                        key={r.id}
                        className="group relative flex flex-col justify-between rounded-xl bg-white p-4 pl-6 my-2.5 shadow-sm transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1 border hover:border-blue-200"
                      >
                        <div>
                          {/* --- Header: Judul & Status --- */}
                          <div className="flex items-start justify-between">
                            <h3 className="pr-2 text-base font-bold text-slate-800 group-hover:text-[#206BB0]">
                              {r.title}
                            </h3>
                            <StatusBadge status={r.status} />
                          </div>

                          {/* --- Meta Info: Kategori & Jadwal --- */}
                          <div className="mt-2 flex flex-col gap-1.5 text-sm text-slate-500 sm:flex-row sm:items-center sm:gap-4">
                            <div className="flex items-center gap-2">
                              <i className="fas fa-tag fa-xs w-4 text-center text-slate-400" />
                              <span className="font-medium">{r.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            </div>
                            {r.scheduled_for && (
                              <div className="flex items-center gap-2">
                                <i className="fas fa-calendar-alt fa-xs w-4 text-center text-slate-400" />
                                <span>{new Date(r.scheduled_for).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* --- Bagian Tengah: Penawaran Harga & Aksi --- */}
                        <div className="mt-4">
                          {/* [BARU] Tampilan Penawaran Harga */}
                          {r.price_offer && (
                            <div className="mb-4 flex items-center justify-between rounded-lg bg-emerald-50/80 px-3 py-2 text-emerald-900">
                              <div className="flex items-center gap-2.5">
                                <i className="fas fa-money-bill-wave text-emerald-600"></i>
                                <span className="text-sm font-semibold">Penawaran Harga</span>
                              </div>
                              <span className="text-base font-bold">
                                {formatRupiah(r.price_offer)}
                              </span>
                            </div>
                          )}

                          {/* --- Aksi Tombol --- */}
                          <div className="flex w-full shrink-0 gap-3">
                            <Link
                              href={`/user/permintaan/${r.id}`}
                              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                            >
                              <i className="fas fa-eye text-xs" />
                              <span>Detail</span>
                            </Link>
                            <Link
                              href={`/user/permintaan/${r.id}/#section-chat-user`}
                              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-[#206BB0] px-3 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#FFBD59] hover:shadow-md hover:shadow-yellow-500/30 focus:outline-none focus:ring-2 focus:ring-[#FFBD59]"
                            >
                              <i className="fas fa-comments text-xs" />
                              <span>Chat</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* --- SIDEBAR (RIGHT/BOTTOM) (Unchanged) --- */}
          <aside className="flex flex-col gap-8 lg:col-span-1">
            {/* ... (isi aside ini sama seperti kode sebelumnya) ... */}
            <section className="reveal" style={{ '--delay': '350ms' }}>
              <h2 className="text-lg font-semibold text-gray-900">Ringkasan Aktivitas</h2>
              <div className="mt-4 space-y-3">
                {[
                  { label: "Permintaan Aktif", value: statsData.active, icon: "fa-bolt", color: "text-amber-500" },
                  { label: "Kunjungan Terjadwal", value: statsData.scheduled, icon: "fa-calendar-check", color: `text-blue-500` },
                  { label: "Servis Selesai", value: statsData.completed, icon: "fa-check-circle", color: "text-green-500" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-4 rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${s.color.replace('text', 'bg')}/10`}>
                      <i className={`fas ${s.icon} ${s.color}`} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                      <p className="text-sm text-gray-600">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section className="reveal" style={{ '--delay': '450ms' }}>
              <div className="rounded-2xl p-6 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${PRIMARY}, #1a5a96)` }}>
                <h3 className="text-lg font-bold">Butuh Bantuan?</h3>
                <p className="mt-1 text-sm opacity-90">Tim support kami siap membantu Anda jika mengalami kendala.</p>
                <Link href="/user/bantuan" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold transition hover:scale-[1.03]" style={{ color: PRIMARY }}>
                  <i className="fas fa-life-ring" /> Pusat Bantuan
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}