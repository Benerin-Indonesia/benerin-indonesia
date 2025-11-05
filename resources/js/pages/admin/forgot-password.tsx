import React from "react";
import { Head, useForm, usePage, Link } from "@inertiajs/react";

const ACCENT = "#111827";
const HINT = "#6B7280";

type PageProps = {
  flash?: { status?: string }
}

export default function AdminForgotPassword() {
  const { flash } = usePage<PageProps>().props;
  const { data, setData, post, processing, errors, clearErrors } = useForm({ email: "" });

  const submit: React.FormEventHandler = (e) => {
    e.preventDefault();
    post("/admin/forgot-password");
  };

  return (
    <>
      <Head title="Lupa Password Admin" />
      <style>{`
        :root { --accent:${ACCENT}; --hint:${HINT}; --ease:cubic-bezier(.22,.8,.28,1); }
        @keyframes float {0%{transform:translateY(0)}50%{transform:translateY(-6px)}100%{transform:translateY(0)}}
        .blob{filter:blur(56px);opacity:.14}.float-slow{animation:float 12s ease-in-out infinite}
        @media (prefers-reduced-motion: reduce){.float-slow{animation:none!important}}
      `}</style>

      <div className="relative min-h-[100svh] overflow-hidden bg-white">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="blob absolute -top-16 -left-10 h-64 w-64 rounded-full float-slow" style={{ background: "#D1D5DB" }} />
          <div className="blob absolute -bottom-16 -right-10 h-72 w-72 rounded-full float-slow" style={{ background: "#E5E7EB" }} />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-md text-center">
            <img src="/storage/assets/logo.png" alt="Benerin Indonesia" className="mx-auto h-10 w-auto sm:h-12" />
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Lupa Password Admin</h1>
            <p className="mt-2 text-sm text-gray-600">Masukkan email admin Anda. Kami akan mengirim tautan reset.</p>
          </div>

          <div className="mx-auto mt-6 max-w-md">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-7">
              {flash?.status && (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700" role="status" aria-live="polite">
                  <i className="fas fa-check-circle mt-0.5" aria-hidden="true" />
                  <div>{flash.status}</div>
                </div>
              )}

              <form onSubmit={submit} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-800">Email Admin</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 grid w-10 place-items-center text-gray-400"><i className="fas fa-envelope" /></span>
                    <input
                      id="email" type="email" inputMode="email" autoComplete="email" required
                      value={data.email}
                      onChange={(e) => { setData("email", e.target.value); if (errors.email) clearErrors("email"); }}
                      className={`w-full rounded-lg border px-3 py-2 pl-10 outline-none transition
                        focus:border-gray-300 focus:ring-2 focus:ring-[var(--accent)]
                        ${errors.email ? "border-red-300 ring-2 ring-red-200" : "border-gray-200"}`}
                      placeholder="admin@example.com"
                    />
                  </div>
                  {errors?.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>

                <button
                  type="submit" disabled={processing} aria-busy={processing}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 font-semibold text-white shadow-sm transition
                             hover:shadow-md hover:brightness-110 active:scale-[.99]"
                >
                  {processing ? (<><i className="fas fa-spinner fa-spin" /> Mengirim…</>) : (<><i className="fas fa-paper-plane" /> Kirim Tautan Reset</>)}
                </button>
              </form>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                <Link href="/admin/login" className="inline-flex items-center gap-2 hover:underline" style={{ color: ACCENT }}>
                  <i className="fas fa-arrow-left text-xs" /> Kembali ke Login
                </Link>
                <Link href="/" className="hover:underline" style={{ color: ACCENT }}>Ke Beranda</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
