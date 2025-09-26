import React, { useState } from "react";
import { Head, useForm, Link } from "@inertiajs/react";

const PRIMARY = "#206BB0";
const SECONDARY = "#FFBD59";

export default function TeknisiRegister() {
  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    name: "",
    email: "",
    password: "",
    agree: false,
  });

  const [showPassword, setShowPassword] = useState(false);

  const submit: React.FormEventHandler = (e) => {
    e.preventDefault();
    post("/teknisi/register", {
      onError: () => reset("password"),
    });
  };

  return (
    <>
      <Head title="Daftar Teknisi" />

      {/* Animasi lembut + var warna */}
      <style>{`
        :root { --p: ${PRIMARY}; --s: ${SECONDARY}; --ease: cubic-bezier(.22,.8,.28,1); }
        @keyframes float { 0%{transform:translateY(0)}50%{transform:translateY(-6px)}100%{transform:translateY(0)} }
        .blob { filter: blur(56px); opacity:.18; }
        .float-slow { animation: float 10s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .float-slow { animation: none !important; } }
      `}</style>

      <div className="relative min-h-[100svh] overflow-hidden bg-white">
        {/* Dekorasi blur halus */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="blob absolute -top-16 -left-10 h-64 w-64 rounded-full float-slow" style={{ background: PRIMARY }} />
          <div className="blob absolute -bottom-16 -right-10 h-72 w-72 rounded-full float-slow" style={{ background: SECONDARY }} />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mx-auto max-w-md text-center">
            <img src="/storage/assets/logo.png" alt="Benerin Indonesia" className="mx-auto h-10 w-auto sm:h-12" />
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Daftar Teknisi</h1>
            <p className="mt-2 text-gray-600">Bergabung untuk menerima permintaan dan kelola pekerjaan Anda.</p>
          </div>

          {/* Card putih tanpa gradasi */}
          <div className="mx-auto mt-6 max-w-md">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-7">
              <form onSubmit={submit} className="space-y-4" noValidate>
                {/* Nama */}
                <div>
                  <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-800">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 grid w-10 place-items-center text-gray-400" aria-hidden="true">
                      <i className="fas fa-user" />
                    </span>
                    <input
                      id="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={data.name}
                      onChange={(e) => {
                        setData("name", e.target.value);
                        if (errors.name) clearErrors("name");
                      }}
                      className={`w-full rounded-lg border px-3 py-2 pl-10 outline-none transition
                                  focus:border-gray-300 focus:ring-2 focus:ring-[var(--p)]
                                  ${errors.name ? "border-red-300 ring-2 ring-red-200" : "border-gray-200"}`}
                      placeholder="Budi Santoso"
                    />
                  </div>
                  {errors?.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                </div>

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
                                  focus:border-gray-300 focus:ring-2 focus:ring-[var(--p)]
                                  ${errors.email ? "border-red-300 ring-2 ring-red-200" : "border-gray-200"}`}
                      placeholder="you@technician.com"
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
                      autoComplete="new-password"
                      required
                      value={data.password}
                      onChange={(e) => {
                        setData("password", e.target.value);
                        if (errors.password) clearErrors("password");
                      }}
                      className={`w-full rounded-lg border px-3 py-2 pl-10 pr-10 outline-none transition
                                  focus:border-gray-300 focus:ring-2 focus:ring-[var(--p)]
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

                {/* Persetujuan */}
                <div className="flex items-start gap-3">
                  <input
                    id="agree"
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-[--tw-ring-color] focus:ring-0"
                    checked={data.agree}
                    onChange={(e) => setData("agree", e.target.checked)}
                    required
                  />
                  <label htmlFor="agree" className="text-sm text-gray-700">
                    Saya menyetujui{" "}
                    <Link href="/ketentuan" className="font-medium hover:underline" style={{ color: PRIMARY }}>
                      Ketentuan
                    </Link>{" "}
                    &{" "}
                    <Link href="/privasi" className="font-medium hover:underline" style={{ color: PRIMARY }}>
                      Kebijakan Privasi
                    </Link>
                    .
                  </label>
                </div>

                {/* Tombol submit */}
                <button
                  type="submit"
                  disabled={processing}
                  aria-busy={processing}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-white shadow-sm
                             transition hover:shadow-md hover:brightness-105 active:scale-[.99]"
                  style={{ backgroundColor: PRIMARY }}
                >
                  {processing && <i className="fas fa-spinner fa-spin" aria-hidden="true" />}
                  Daftar
                </button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-gray-200" />
                <span className="text-xs uppercase tracking-wider text-gray-400">atau</span>
                <span className="h-px flex-1 bg-gray-200" />
              </div>

              {/* Punya akun? */}
              <p className="text-center text-sm text-gray-600">
                Sudah punya akun?{" "}
                <Link href="/teknisi/login" className="font-semibold hover:underline" style={{ color: PRIMARY }}>
                  Masuk
                </Link>
              </p>

              {/* Pindah peran */}
              <p className="mt-2 text-center text-xs text-gray-500">
                <Link href="/register" className="hover:underline" style={{ color: PRIMARY }}>
                  Pilih peran lain
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
