import React, { useState } from "react";
import { Head, useForm, Link } from "@inertiajs/react";

const ACCENT = "#111827"; // abu-abu tua (nuansa admin)
const HINT = "#6B7280";

export default function AdminLogin() {
  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    email: "",
    password: "",
    remember: false,
  });

  const [showPassword, setShowPassword] = useState(false);

  const submit: React.FormEventHandler = (e) => {
    e.preventDefault();
    post("/admin/login", {
      onError: () => reset("password"),
    });
  };

  return (
    <>
      <Head title="Login Admin" />

      <style>{`
        :root { --accent: ${ACCENT}; --hint: ${HINT}; --ease: cubic-bezier(.22,.8,.28,1); }
        @keyframes float { 0%{transform:translateY(0)}50%{transform:translateY(-6px)}100%{transform:translateY(0)} }
        .blob { filter: blur(56px); opacity:.14; }
        .float-slow { animation: float 12s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .float-slow { animation: none !important; } }
      `}</style>

      <div className="relative min-h-[100svh] overflow-hidden bg-white">
        {/* Dekorasi lembut, netral untuk admin */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="blob absolute -top-16 -left-10 h-64 w-64 rounded-full float-slow" style={{ background: "#D1D5DB" }} />
          <div className="blob absolute -bottom-16 -right-10 h-72 w-72 rounded-full float-slow" style={{ background: "#E5E7EB" }} />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mx-auto max-w-md text-center">
            <img src="/storage/assets/logo.png" alt="Benerin Indonesia" className="mx-auto h-10 w-auto sm:h-12" />
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Login Admin</h1>
            <p className="mt-2 text-sm text-gray-600">
              Akses terbatas. Gunakan kredensial admin Anda.
            </p>
          </div>

          {/* Card putih, tanpa gradasi */}
          <div className="mx-auto mt-6 max-w-md">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-7">
              {/* Badge kecil */}
              <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
                <i className="fas fa-shield-alt text-[12px] text-gray-500" aria-hidden="true" />
                Akses Admin
              </div>

              <form onSubmit={submit} className="space-y-4" noValidate>
                {/* Email */}
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-800">
                    Email
                  </label>
                  <div className="relative">
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
                      className={`w-full rounded-lg border px-3 py-2 pl-10 outline-none transition
                                  focus:border-gray-300 focus:ring-2 focus:ring-[var(--accent)]
                                  ${errors.email ? "border-red-300 ring-2 ring-red-200" : "border-gray-200"}`}
                      placeholder="admin@example.com"
                    />
                  </div>
                  {errors?.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-800">
                    Password
                  </label>
                  <div className="relative">
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
                      className={`w-full rounded-lg border px-3 py-2 pl-10 pr-10 outline-none transition
                                  focus:border-gray-300 focus:ring-2 focus:ring-[var(--accent)]
                                  ${errors.password ? "border-red-300 ring-2 ring-red-200" : "border-gray-200"}`}
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

                {/* Ingat saya & lupa password */}
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

                  <Link href="/admin/forgot-password" className="text-sm font-medium hover:underline" style={{ color: ACCENT }}>
                    Lupa password?
                  </Link>
                </div>

                {/* Tombol submit */}
                <button
                  type="submit"
                  disabled={processing}
                  aria-busy={processing}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 font-semibold text-white shadow-sm transition
                             hover:shadow-md hover:brightness-110 active:scale-[.99]"
                >
                  {processing && <i className="fas fa-spinner fa-spin" aria-hidden="true" />}
                  Masuk
                </button>
              </form>

              {/* Info keamanan */}
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs text-gray-600">
                <i className="fas fa-info-circle mt-0.5 text-[--hint]" aria-hidden="true" />
                <p>
                  Untuk keamanan, jangan bagikan kredensial admin. Akses ini tidak ditampilkan di halaman publik.
                </p>
              </div>

              {/* Kembali ke beranda */}
              <p className="mt-4 text-center text-xs text-gray-500">
                <Link href="/" className="hover:underline" style={{ color: ACCENT }}>
                  ← Kembali ke beranda
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
