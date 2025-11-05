import React, { useEffect, useState } from "react";
import { Head, useForm, Link, usePage } from "@inertiajs/react";

const PRIMARY = "#206BB0";
const SECONDARY = "#FFBD59";

type PageProps = {
  flash?: { status?: string; success?: string; error?: string };
};

export default function TechnicianForgotPassword() {
  const { flash } = usePage<PageProps>().props;

  const { data, setData, post, processing, errors, reset } = useForm({
    email: "",
  });

  // Toast state (sesuai pola admin/user)
  const flashMessage = flash?.status || flash?.success || null;
  const flashError = flash?.error || null;

  const [toast, setToast] = useState<{
    visible: boolean;
    text: string;
    variant: "success" | "error";
  }>({
    visible: !!(flashMessage || flashError),
    text: flashMessage || flashError || "",
    variant: (flashMessage ? "success" : "error") as "success" | "error",
  });

  useEffect(() => {
    const text = flashMessage ?? flashError;
    if (!text) return;
    setToast({
      visible: true,
      text,
      variant: (flashMessage ? "success" : "error") as "success" | "error",
    });
    const t = setTimeout(() => setToast((s) => ({ ...s, visible: false })), 4500);
    return () => clearTimeout(t);
  }, [flashMessage, flashError]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    post("/teknisi/forgot-password", {
      onSuccess: () => reset("email"),
    });
  }

  return (
    <>
      <Head title="Lupa Password Teknisi" />

      <style>{`
        :root { --ease: cubic-bezier(.22,.8,.28,1); }
        @keyframes float { 0%{transform:translateY(0)}50%{transform:translateY(-6px)}100%{transform:translateY(0)} }
        @keyframes shrink { from{transform:scaleX(1)} to{transform:scaleX(0)} }
        .blob { filter: blur(56px); opacity:.15; }
        .float-slow { animation: float 10s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .float-slow { animation: none !important; } }
      `}</style>

      {/* Toast Notifikasi */}
      {toast.visible && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed right-4 top-4 z-50 w-[clamp(260px,40vw,360px)] overflow-hidden rounded-xl border bg-white shadow-lg
            ${toast.variant === "success" ? "border-green-200" : "border-red-200"}`}
        >
          <div className="flex items-start gap-3 px-4 py-3">
            <span
              className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full
                ${toast.variant === "success" ? "bg-green-100" : "bg-red-100"}`}
            >
              <i
                className={`fas ${toast.variant === "success" ? "fa-check text-green-600" : "fa-times text-red-600"} text-[11px]`}
                aria-hidden="true"
              />
            </span>
            <div className="min-w-0 grow">
              <p className="truncate text-sm font-medium text-gray-900">
                {toast.variant === "success" ? "Berhasil" : "Gagal"}
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs text-gray-600">{toast.text}</p>
            </div>
            <button
              type="button"
              onClick={() => setToast((s) => ({ ...s, visible: false }))}
              className="ml-2 inline-flex rounded-md p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              aria-label="Tutup notifikasi"
            >
              <i className="fas fa-times text-[12px]" />
            </button>
          </div>
          <div className={`h-0.5 w-full ${toast.variant === "success" ? "bg-green-100" : "bg-red-100"}`}>
            <div
              className={`h-full w-full origin-left animate-[shrink_4.5s_linear_forwards] ${
                toast.variant === "success" ? "bg-green-500/60" : "bg-red-500/60"
              }`}
            />
          </div>
        </div>
      )}

      <div className="relative min-h-[100svh] overflow-hidden bg-white">
        {/* Background blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="blob absolute -top-16 -left-10 h-64 w-64 rounded-full float-slow"
            style={{ background: PRIMARY }}
          />
          <div
            className="blob absolute -bottom-16 -right-10 h-72 w-72 rounded-full float-slow"
            style={{ background: SECONDARY }}
          />
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
              Lupa Password Teknisi
            </h1>
            <p className="mt-2 text-gray-600">
              Masukkan email akun teknisi Anda. Kami akan mengirim tautan untuk mengatur ulang password.
            </p>
          </div>

          {/* Card */}
          <div className="mx-auto mt-6 max-w-md">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md sm:p-7">
              {/* Subheader dalam card */}
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="grid h-11 w-11 place-items-center rounded-xl"
                  style={{ background: "#EAF3FB", color: PRIMARY }}
                >
                  <i className="fas fa-tools text-lg" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    Pemulihan Akun Teknisi
                  </div>
                  <div className="text-xs text-gray-500">
                    Masukkan email untuk menerima tautan reset
                  </div>
                </div>
              </div>

              <form onSubmit={submit} className="mt-2 space-y-4" noValidate>
                {/* Email */}
                <div className="group">
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-800">
                    Email
                  </label>
                  <div
                    className={`relative rounded-lg border ${
                      errors.email ? "border-red-300" : "border-gray-200"
                    } focus-within:border-gray-300 focus-within:ring-2 focus-within:ring-[#206BB0] transition`}
                  >
                    <span className="pointer-events-none absolute inset-y-0 left-0 grid w-10 place-items-center text-gray-400" aria-hidden="true">
                      <i className="fas fa-envelope" />
                    </span>
                    <input
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoFocus
                      required
                      value={data.email}
                      onChange={(e) => {
                        setData("email", e.target.value);
                      }}
                      className="w-full rounded-lg bg-transparent px-3 py-2 pl-10 outline-none"
                      placeholder="teknisi@example.com"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "email-error" : undefined}
                    />
                  </div>
                  {errors.email && (
                    <p id="email-error" className="mt-1 text-xs text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={processing}
                  aria-busy={processing}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#206BB0] px-4 py-2.5 font-semibold text-white shadow-sm transition hover:shadow-md hover:brightness-105 active:scale-[.99] disabled:opacity-60"
                >
                  {processing && <i className="fas fa-spinner fa-spin" aria-hidden="true" />}
                  Kirim Tautan Reset
                </button>
              </form>

              <div className="mt-4 text-center text-sm text-gray-600">
                <Link href="/teknisi/login" className="underline">
                  Kembali ke login teknisi
                </Link>
              </div>
            </div>

            {/* Footer kecil */}
            <div className="mt-6 text-center text-xs text-gray-500">
              © {new Date().getFullYear()} Benerin Indonesia
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
