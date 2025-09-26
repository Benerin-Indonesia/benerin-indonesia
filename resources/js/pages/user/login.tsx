import React, { useState } from "react";
import { Head, useForm, Link } from "@inertiajs/react";

const PRIMARY = "#206BB0";
const SECONDARY = "#FFBD59";

export default function UserLogin() {
  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    email: "",
    password: "",
    remember: false,
  });

  const [showPassword, setShowPassword] = useState(false);

  const submit: React.FormEventHandler = (e) => {
    e.preventDefault();
    post("/user/login", {
      onError: () => reset("password"),
    });
  };

  return (
    <>
      <Head title="Login Pengguna" />

      {/* Dekorasi lembut + hormati prefers-reduced-motion */}
      <style>{`
        :root { --ease: cubic-bezier(.22,.8,.28,1); }
        @keyframes float { 0%{transform:translateY(0)}50%{transform:translateY(-6px)}100%{transform:translateY(0)} }
        .blob { filter: blur(56px); opacity:.15; }
        .float-slow { animation: float 10s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .float-slow { animation: none !important; } }
      `}</style>

      <div className="relative min-h-[100svh] overflow-hidden bg-white">
        {/* Background blobs (bukan gradasi card) */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="blob absolute -top-16 -left-10 h-64 w-64 rounded-full float-slow" style={{ background: PRIMARY }} />
          <div className="blob absolute -bottom-16 -right-10 h-72 w-72 rounded-full float-slow" style={{ background: SECONDARY }} />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mx-auto max-w-md text-center">
            <img
              src="/storage/assets/logo.png"
              alt="Benerin Indonesia"
              className="mx-auto h-10 w-auto sm:h-12"
            />
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Login Pengguna
            </h1>
            <p className="mt-2 text-gray-600">
              Masuk untuk melanjutkan pemesanan layanan.
            </p>
          </div>

          {/* CARD putih tanpa gradasi */}
          <div className="mx-auto mt-6 max-w-md">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md sm:p-7">
              {/* Header kecil di dalam card */}
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: "#EAF3FB", color: PRIMARY }}>
                  <i className="fas fa-user text-lg" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Masuk sebagai Pengguna</div>
                  <div className="text-xs text-gray-500">Gunakan email dan kata sandi Anda</div>
                </div>
              </div>

              <form onSubmit={submit} className="space-y-4" noValidate>
                {/* Email */}
                <div className="group">
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-800">
                    Email
                  </label>
                  <div className={`relative rounded-lg border ${errors.email ? "border-red-300" : "border-gray-200"} focus-within:border-gray-300 focus-within:ring-2 focus-within:ring-[#206BB0] transition`}>
                    <span className="pointer-events-none absolute inset-y-0 left-0 grid w-10 place-items-center text-gray-400" aria-hidden="true">
                      <i className="fas fa-envelope" />
                    </span>
                    <input
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      required
                      value={data.email}
                      onChange={(e) => {
                        setData("email", e.target.value);
                        if (errors.email) clearErrors("email");
                      }}
                      className="w-full rounded-lg bg-transparent px-3 py-2 pl-10 outline-none"
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors?.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>

                {/* Password */}
                <div className="group">
                  <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-800">
                    Password
                  </label>
                  <div className={`relative rounded-lg border ${errors.password ? "border-red-300" : "border-gray-200"} focus-within:border-gray-300 focus-within:ring-2 focus-within:ring-[#206BB0] transition`}>
                    <span className="pointer-events-none absolute inset-y-0 left-0 grid w-10 place-items-center text-gray-400" aria-hidden="true">
                      <i className="fas fa-lock" />
                    </span>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={data.password}
                      onChange={(e) => {
                        setData("password", e.target.value);
                        if (errors.password) clearErrors("password");
                      }}
                      className="w-full rounded-lg bg-transparent px-3 py-2 pl-10 pr-10 outline-none"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute inset-y-0 right-0 grid w-10 place-items-center text-gray-400 hover:text-gray-600"
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                      tabIndex={-1}
                    >
                      <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
                    </button>
                  </div>
                  {errors?.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                </div>

                {/* Remember & Bantuan */}
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-[--tw-ring-color] focus:ring-0"
                      checked={data.remember}
                      onChange={(e) => setData("remember", e.target.checked)}
                    />
                    Ingat saya
                  </label>
                  <Link href="/forgot-password" className="text-sm font-medium hover:underline" style={{ color: PRIMARY }}>
                    Lupa password?
                  </Link>
                </div>

                {/* Tombol submit */}
                <button
                  type="submit"
                  disabled={processing}
                  aria-busy={processing}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#206BB0] px-4 py-2.5 font-semibold text-white shadow-sm transition hover:shadow-md hover:brightness-105 active:scale-[.99]"
                >
                  {processing && <i className="fas fa-spinner fa-spin" aria-hidden="true" />}
                  Masuk
                </button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-gray-200" />
                <span className="text-xs uppercase tracking-wider text-gray-400">atau</span>
                <span className="h-px flex-1 bg-gray-200" />
              </div>

              {/* Link daftar */}
              <p className="text-center text-sm text-gray-600">
                Belum punya akun?{" "}
                <Link href="/user/register" className="font-semibold hover:underline" style={{ color: PRIMARY }}>
                  Daftar
                </Link>
              </p>

              {/* Kembali ke pilihan peran */}
              <p className="mt-2 text-center text-xs text-gray-500">
                <Link href="/register" className="hover:underline" style={{ color: PRIMARY }}>
                  Pilih peran lain
                </Link>
              </p>
            </div>

            {/* Info link teknisi */}
            <div className="mt-4 text-center text-xs text-gray-500">
              Teknisi?{" "}
              <Link href="/teknisi/login" className="hover:underline" style={{ color: PRIMARY }}>
                Masuk di sini
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
