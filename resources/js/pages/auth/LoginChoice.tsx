import React from "react";
import { Link, Head } from "@inertiajs/react";

const PRIMARY = "#206BB0";
const SECONDARY = "#FFBD59";

export default function LoginChoice() {
  return (
    <>
      <Head title="Pilih Login" />

      {/* Animasi & guard motion */}
      <style>{`
        :root { --ease: cubic-bezier(.22,.8,.28,1); }
        @keyframes float { 0%{transform:translateY(0)}50%{transform:translateY(-6px)}100%{transform:translateY(0)} }
        .blob { filter: blur(48px); opacity:.18; }
        .float-slow { animation: float 10s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .float-slow { animation: none !important; } }
      `}</style>

      <div className="relative min-h-[100svh] overflow-hidden bg-white">
        {/* Dekorasi lembut */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="blob absolute top-[6%] left-[8%] h-64 w-64 rounded-full float-slow" style={{ background: PRIMARY }} />
          <div className="blob absolute bottom-[8%] right-[10%] h-72 w-72 rounded-full float-slow" style={{ background: SECONDARY }} />
        </div>

        {/* Container */}
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mx-auto max-w-2xl text-center">
            <img
              src="/storage/assets/logo.png"
              alt="Benerin Indonesia"
              className="mx-auto h-10 w-auto sm:h-12"
            />
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Masuk sebagai
            </h1>
            <p className="mt-2 text-gray-600">
              Pilih peran yang sesuai untuk melanjutkan.
            </p>
          </div>

          {/* Grid kartu: clean card tanpa gradasi */}
          <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6">
            {/* Card: Pengguna */}
            <Link
              href="/user/login"
              className="group block h-full rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition
                         hover:-translate-y-0.5 hover:shadow-md focus-visible:shadow-md sm:p-6"
            >
              <div className="flex h-full items-start gap-4">
                <div
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-105"
                  style={{ background: "#EAF3FB", color: PRIMARY }}
                  aria-hidden="true"
                >
                  <i className="fas fa-user text-[20px] sm:text-[22px]" />
                </div>

                <div className="flex min-h-[170px] flex-1 flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-semibold text-gray-900">Pengguna</h2>
                    <i
                      className="fas fa-arrow-right text-[18px] translate-x-0 opacity-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:opacity-100"
                      style={{ color: PRIMARY }}
                      aria-hidden="true"
                    />
                  </div>

                  <p className="mt-1 text-sm text-gray-600">
                    Cari & pesan layanan perbaikan perangkat elektronik.
                  </p>

                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-4 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: SECONDARY }} />
                      Cepat & mudah
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: PRIMARY }} />
                      Transparan
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Card: Teknisi */}
            <Link
              href="/teknisi/login"
              className="group block h-full rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition
                         hover:-translate-y-0.5 hover:shadow-md focus-visible:shadow-md sm:p-6"
            >
              <div className="flex h-full items-start gap-4">
                <div
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-105"
                  style={{ background: "#FFF3DC", color: "#8A5A00" }}
                  aria-hidden="true"
                >
                  <i className="fas fa-tools text-[20px] sm:text-[22px]" />
                </div>

                <div className="flex min-h-[170px] flex-1 flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-semibold text-gray-900">Teknisi</h2>
                    <i
                      className="fas fa-arrow-right text-[18px] translate-x-0 opacity-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:opacity-100"
                      style={{ color: PRIMARY }}
                      aria-hidden="true"
                    />
                  </div>

                  <p className="mt-1 text-sm text-gray-600">
                    Kelola permintaan, chat, penawaran, dan pendapatan Anda.
                  </p>

                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-4 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: PRIMARY }} />
                      Notifikasi real-time
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: SECONDARY }} />
                      Penjadwalan
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* CTA bawah */}
          <div className="mx-auto mt-6 max-w-3xl text-center text-sm text-gray-600">
            Belum punya akun?{" "}
            <Link href="/register" className="font-semibold hover:underline" style={{ color: PRIMARY }}>
              Daftar
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
