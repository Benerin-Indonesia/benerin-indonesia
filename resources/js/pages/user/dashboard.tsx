import React, { useEffect } from "react";
import { Head, Link, usePage } from "@inertiajs/react";

const PRIMARY = "#206BB0";

type AuthUser = { id: number; name: string; email: string; role: string };
type RequestItem = {
  id: number;
  title: string;
  category: string;
  scheduled_for?: string | null;
  status: "menunggu" | "diproses" | "dijadwalkan" | "selesai" | "dibatalkan";
};
type PageProps = {
  auth?: { user: AuthUser | null };
  stats?: { active: number; scheduled: number; completed: number };
  recent?: RequestItem[];
};

// Kategori (slug konsisten dgn backend)
const CATEGORIES: { slug: string; name: string; icon: string; hint: string }[] = [
  { slug: "ac",         name: "AC",         icon: "fas fa-snowflake",  hint: "Bersih, isi freon, servis" },
  { slug: "tv",         name: "TV",         icon: "fas fa-tv",         hint: "Gambar/suara bermasalah" },
  { slug: "kulkas",     name: "Kulkas",     icon: "fas fa-icicles",    hint: "Tidak dingin, bocor" },
  { slug: "mesin-cuci", name: "Mesin Cuci", icon: "fas fa-soap",       hint: "Bunyi, tidak berputar" },
];

function statusBadge(s: RequestItem["status"]) {
  const map: Record<RequestItem["status"], { text: string; cls: string }> = {
    menunggu:    { text: "Menunggu",    cls: "bg-gray-100 text-gray-700 border-gray-200" },
    diproses:    { text: "Diproses",    cls: "bg-blue-50 text-blue-700 border-blue-200" },
    dijadwalkan: { text: "Dijadwalkan", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    selesai:     { text: "Selesai",     cls: "bg-green-50 text-green-700 border-green-200" },
    dibatalkan:  { text: "Dibatalkan",  cls: "bg-red-50 text-red-700 border-red-200" },
  };
  const m = map[s];
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs ${m.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" /> {m.text}
    </span>
  );
}

export default function UserDashboard() {
  const { auth, stats, recent } = usePage<PageProps>().props || {};
  const name = auth?.user?.name ?? "Pengguna";

  // Dummy agar tidak blank ketika BE belum kirim data
  const statsData = stats ?? { active: 1, scheduled: 1, completed: 3 };
  const recentData: RequestItem[] = recent ?? [
    { id: 101, title: "Servis AC Daikin 1/2 PK", category: "ac",      scheduled_for: "2025-10-01 14:00", status: "dijadwalkan" },
    { id: 102, title: "TV LED Samsung tidak nyala", category: "tv",   scheduled_for: null,               status: "menunggu" },
    { id: 103, title: "Kulkas dua pintu kurang dingin", category: "kulkas", scheduled_for: "2025-10-03 09:00", status: "diproses" },
  ];

  // Reveal aman: konten TETAP terlihat jika JS gagal.
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const elements = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    // Siapkan untuk animasi; kalau IO tak ada, langsung tampilkan.
    const prepare = (el: HTMLElement) => el.classList.add("reveal-prepare");
    const show = (el: HTMLElement) => el.classList.add("show");

    elements.forEach(prepare);

    if ("IntersectionObserver" in window) {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              show(entry.target as HTMLElement);
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      elements.forEach((el) => obs.observe(el));
      return () => obs.disconnect();
    } else {
      // Fallback: selalu tampil
      elements.forEach(show);
    }
  }, []);

  return (
    <>
      <Head title="Beranda Pengguna" />

      {/* Animasi reveal: default TIDAK menyembunyikan. Hanya disembunyikan saat JS menambahkan .reveal-prepare */}
      <style>{`
        :root { --ease: cubic-bezier(.22,.8,.28,1); }
        .reveal { transition: all .5s var(--ease); }
        .reveal-prepare { opacity: 0; transform: translateY(12px); }
        .reveal-prepare.show { opacity: 1; transform: none; }
        @media (prefers-reduced-motion: reduce) {
          .reveal, .reveal-prepare, .reveal-prepare.show { transition: none !important; transform: none !important; opacity: 1 !important; }
        }
      `}</style>
      <noscript>
        <style>{`.reveal { opacity: 1 !important; transform: none !important; }`}</style>
      </noscript>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header + Aksi Cepat */}
        <div className="reveal">
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                Halo, {name.split(" ")[0]} 👋
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Pilih kategori di bawah untuk membuat permintaan servis.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/u/permintaan/buat"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md hover:brightness-105"
                style={{ backgroundColor: PRIMARY }}
              >
                <i className="fas fa-plus" /> Buat Permintaan
              </Link>
              <Link
                href="/u/permintaan"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                <i className="fas fa-clipboard-list" /> Lihat Semua
              </Link>
            </div>
          </div>
        </div>

        {/* Kategori Servis */}
        <section className="reveal mt-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Kategori Servis</h2>
              <Link href="/u/permintaan/buat" className="text-sm font-semibold hover:underline" style={{ color: PRIMARY }}>
                Semua kategori →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {CATEGORIES.map((c) => (
                <div
                  key={c.slug}
                  className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-gray-50 text-gray-700">
                      <i className={c.icon} aria-hidden="true" />
                    </span>
                    <div>
                      <div className="font-semibold text-gray-900">{c.name}</div>
                      <div className="text-xs text-gray-500">{c.hint}</div>
                    </div>
                  </div>
                  <Link
                    href={`/u/permintaan/buat?category=${encodeURIComponent(c.slug)}`}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                  >
                    <i className="fas fa-paper-plane" /> Buat Permintaan
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats singkat */}
        <div className="reveal mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Permintaan Aktif", value: statsData.active,    icon: "fa-bolt",           hint: "Sedang jalan" },
            { label: "Terjadwal",        value: statsData.scheduled, icon: "fa-calendar-check", hint: "Kunjungan teknisi" },
            { label: "Selesai",          value: statsData.completed, icon: "fa-check-circle",   hint: "Perbaikan tuntas" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">{s.label}</p>
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-gray-50 text-gray-600">
                  <i className={`fas ${s.icon}`} />
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900">{s.value}</div>
              <p className="mt-1 text-xs text-gray-500">{s.hint}</p>
            </div>
          ))}
        </div>

        {/* Permintaan Terbaru */}
        <div className="reveal mt-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Permintaan Terbaru</h2>
              <Link href="/u/permintaan" className="text-sm font-semibold hover:underline" style={{ color: PRIMARY }}>
                Lihat semua →
              </Link>
            </div>

            <div className="mt-4 divide-y divide-gray-100">
              {recentData.length === 0 ? (
                <div className="py-6 text-sm text-gray-600">
                  Belum ada permintaan.{" "}
                  <Link href="/u/permintaan/buat" className="font-semibold hover:underline" style={{ color: PRIMARY }}>
                    Buat sekarang
                  </Link>.
                </div>
              ) : (
                recentData.map((r) => (
                  <div key={r.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-gray-900">{r.title}</p>
                        {statusBadge(r.status)}
                      </div>
                      <p className="mt-0.5 text-sm text-gray-600">
                        <i className="fas fa-plug mr-1.5 text-xs text-gray-400" />
                        {r.category}
                        {r.scheduled_for && (
                          <>
                            {" "}<span className="mx-1.5 text-gray-300">•</span>
                            <i className="fas fa-calendar-alt mr-1 text-xs text-gray-400" />
                            {r.scheduled_for}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Link
                        href={`/u/permintaan/${r.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        <i className="fas fa-eye" /> Detail
                      </Link>
                      <Link
                        href={`/u/chat?request=${r.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        <i className="fas fa-comments" /> Chat
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Tips / bantuan */}
        <div className="reveal mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">Tips cepat</h3>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-600">
              <li>Jelaskan gejala perangkat sedetail mungkin.</li>
              <li>Unggah foto/video jika ada agar teknisi akurat memberi penawaran.</li>
              <li>Pilih jadwal yang fleksibel untuk percepat penugasan.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">Butuh bantuan?</h3>
            <p className="mt-2 text-sm text-gray-600">
              Tim kami siap membantu via pusat bantuan.
            </p>
            <div className="mt-3">
              <Link
                href="/bantuan"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
                style={{ backgroundColor: PRIMARY }}
              >
                <i className="fas fa-life-ring" /> Pusat Bantuan
              </Link>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
