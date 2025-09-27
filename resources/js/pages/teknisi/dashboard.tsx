import React, { useEffect, useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";

const PRIMARY = "#206BB0";

type AuthUser = { id: number; name: string; email: string; role: string };
type JobItem = {
  id: number;
  title: string;
  category: string;
  distance_km?: number | null;
  scheduled_for?: string | null;
  status: "baru" | "ditawar" | "dijadwalkan" | "dikerjakan" | "selesai";
  price_offer?: number | null;
};
type PageProps = {
  auth?: { user: AuthUser | null };
  stats?: { today: number; in_progress: number; revenue_today: number };
  incoming?: JobItem[];
  verification?: "verified" | "pending" | "rejected";
};

function money(n?: number | null) {
  if (n == null) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function statusPill(s: JobItem["status"]) {
  const map: Record<JobItem["status"], { text: string; cls: string }> = {
    baru:        { text: "Baru",        cls: "bg-blue-50 text-blue-700 border-blue-200" },
    ditawar:     { text: "Ditawar",     cls: "bg-amber-50 text-amber-700 border-amber-200" },
    dijadwalkan: { text: "Dijadwalkan", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    dikerjakan:  { text: "Dikerjakan",  cls: "bg-purple-50 text-purple-700 border-purple-200" },
    selesai:     { text: "Selesai",     cls: "bg-green-50 text-green-700 border-green-200" },
  };
  const m = map[s];
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs ${m.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" /> {m.text}
    </span>
  );
}

export default function TechnicianDashboard() {
  const { auth, stats, incoming, verification } = usePage<PageProps>().props || {};
  const name = auth?.user?.name ?? "Teknisi";
  const [available, setAvailable] = useState(true);

  // Dummy fallback agar tidak blank
  const statsData = stats ?? { today: 0, in_progress: 0, revenue_today: 0 };
  const incomingData: JobItem[] =
    incoming ?? [
      {
        id: 301,
        title: "Servis AC Panasonic 1 PK",
        category: "ac",
        distance_km: 3.4,
        scheduled_for: null,
        status: "baru",
      },
      {
        id: 302,
        title: "Kulkas tidak dingin",
        category: "kulkas",
        distance_km: 5.2,
        scheduled_for: "2025-10-02 10:00",
        status: "dijadwalkan",
        price_offer: 250000,
      },
      {
        id: 303,
        title: "TV LED garis vertikal",
        category: "tv",
        distance_km: 2.1,
        scheduled_for: null,
        status: "ditawar",
        price_offer: 180000,
      },
    ];

  // Reveal aman: default terlihat; hanya disembunyikan saat JS aktif (progressive enhancement)
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    const prep = (el: HTMLElement) => el.classList.add("reveal-prepare");
    const show = (el: HTMLElement) => el.classList.add("show");
    els.forEach(prep);

    if ("IntersectionObserver" in window) {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              show(e.target as HTMLElement);
              obs.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      els.forEach((el) => obs.observe(el));
      return () => obs.disconnect();
    } else {
      els.forEach(show);
    }
  }, []);

  const verificationClass =
    verification === "verified"
      ? "border-green-200 bg-green-50 text-green-700"
      : verification === "pending"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : verification === "rejected"
      ? "border-red-200 bg-red-50 text-red-700"
      : "";

  const verificationIcon =
    verification === "verified"
      ? "fas fa-badge-check text-green-600"
      : verification === "pending"
      ? "fas fa-hourglass-half text-amber-600"
      : verification === "rejected"
      ? "fas fa-exclamation-triangle text-red-600"
      : "";

  const verificationText =
    verification === "verified"
      ? "Akun terverifikasi"
      : verification === "pending"
      ? "Verifikasi diproses"
      : verification === "rejected"
      ? "Verifikasi ditolak – unggah ulang dokumen"
      : "";

  return (
    <>
      <Head title="Beranda Teknisi" />

      {/* Animasi reveal */}
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
        {/* Header */}
        <div className="reveal">
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                Selamat datang, {name.split(" ")[0]} 👨‍🔧
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Kelola permintaan, penawaran, jadwal, dan pendapatan Anda.
              </p>

              {verification && (
                <div
                  className={`mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${verificationClass}`}
                >
                  <i className={verificationIcon} aria-hidden="true" />
                  {verificationText}
                </div>
              )}
            </div>

            {/* Toggle ketersediaan (demo front-end) */}
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-2">
              <span className="text-sm text-gray-700">Ketersediaan</span>
              <button
                onClick={() => setAvailable((s) => !s)}
                className={`relative h-8 w-14 rounded-full transition ${available ? "bg-green-500" : "bg-gray-300"}`}
                aria-pressed={available}
                aria-label="Toggle ketersediaan"
              >
                <span
                  className={`absolute top-1 inline-block h-6 w-6 rounded-full bg-white transition ${available ? "left-7" : "left-1"}`}
                />
              </button>
              <span className={`text-sm ${available ? "text-green-700" : "text-gray-600"}`}>
                {available ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="reveal mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Tugas Hari Ini", value: statsData.today, icon: "fa-calendar-day" },
            { label: "Sedang Dikerjakan", value: statsData.in_progress, icon: "fa-tools" },
            { label: "Pendapatan Hari Ini", value: money(statsData.revenue_today), icon: "fa-wallet" },
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
            </div>
          ))}
        </div>

        {/* Permintaan masuk */}
        <div className="reveal mt-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Permintaan Masuk</h2>
              <Link href="/teknisi/permintaan" className="text-sm font-semibold hover:underline" style={{ color: PRIMARY }}>
                Semua permintaan →
              </Link>
            </div>

            <div className="mt-4 divide-y divide-gray-100">
              {incomingData.length === 0 ? (
                <div className="py-6 text-sm text-gray-600">
                  Belum ada permintaan baru. Tetap online untuk menerima order.
                </div>
              ) : (
                incomingData.map((j) => (
                  <div key={j.id} className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-gray-900">{j.title}</p>
                        {statusPill(j.status)}
                      </div>
                      <p className="mt-0.5 text-sm text-gray-600">
                        <i className="fas fa-plug mr-1.5 text-xs text-gray-400" />
                        {j.category}
                        {j.distance_km != null && (
                          <>
                            <span className="mx-1.5 text-gray-300">•</span>
                            <i className="fas fa-location-arrow mr-1 text-xs text-gray-400" />
                            ±{j.distance_km.toFixed(1)} km
                          </>
                        )}
                        {j.scheduled_for && (
                          <>
                            <span className="mx-1.5 text-gray-300">•</span>
                            <i className="fas fa-calendar-alt mr-1 text-xs text-gray-400" />
                            {j.scheduled_for}
                          </>
                        )}
                      </p>
                      {j.price_offer != null && (
                        <p className="mt-0.5 text-xs text-gray-500">
                          Tawaran Anda: <span className="font-medium text-gray-700">{money(j.price_offer)}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link
                        href={`/teknisi/permintaan/${j.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        <i className="fas fa-eye" /> Detail
                      </Link>
                      <Link
                        href={`/teknisi/penawaran/buat?request=${j.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
                        style={{ backgroundColor: PRIMARY }}
                      >
                        <i className="fas fa-paper-plane" /> Kirim Penawaran
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Pintasan */}
        <div className="reveal mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { label: "Jadwal Saya", icon: "fa-calendar", href: "/teknisi/jadwal" },
            { label: "Riwayat Pekerjaan", icon: "fa-history", href: "/teknisi/riwayat" },
            { label: "Tarik Saldo", icon: "fa-money-bill-wave", href: "/teknisi/wallet" },
          ].map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 text-gray-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-gray-50 text-gray-700">
                <i className={`fas ${a.icon}`} />
              </span>
              <span className="font-medium">{a.label}</span>
            </Link>
          ))}
        </div>

        {/* Bantuan */}
        <div className="reveal mt-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Butuh bantuan?</h3>
              <Link href="/bantuan/teknisi" className="text-sm font-semibold hover:underline" style={{ color: PRIMARY }}>
                Panduan Teknisi →
              </Link>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Pelajari cara meningkatkan win-rate penawaran, atur jadwal, dan kebijakan payout.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
