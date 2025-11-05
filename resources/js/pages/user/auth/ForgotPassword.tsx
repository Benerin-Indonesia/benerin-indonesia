import React from "react";
import { Head, useForm, Link, usePage } from "@inertiajs/react";

type PageProps = {
  flash?: { status?: string };
};

export default function ForgotPassword() {
  const { flash } = usePage<PageProps>().props;

  const { data, setData, post, processing, errors, reset } = useForm({
    email: "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    post("/user/forgot-password", {
      onSuccess: () => reset("email"),
    });
  }

  return (
    <>
      <Head title="Lupa Password" />

      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">

          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img
              src="/storage/assets/logo.png"
              alt="Benerin Indonesia"
              className="h-12 w-auto"
            />
          </div>

          {/* Title */}
          <h1 className="text-xl font-semibold text-center text-gray-900">
            Lupa Password
          </h1>
          <p className="mt-1 text-sm text-center text-gray-600">
            Masukkan email akun Anda. Kami akan mengirim tautan untuk mengatur ulang password.
          </p>

          {/* Flash Message */}
          {flash?.status && (
            <div
              role="status"
              className="mt-4 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 text-center"
            >
              {flash.status}
            </div>
          )}

          <form onSubmit={submit} className="mt-5">
            <label htmlFor="email" className="text-sm text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoFocus
              value={data.email}
              onChange={(e) => setData("email", e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#206BB0]/30"
              placeholder="nama@contoh.com"
              required
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}

            <button
              type="submit"
              disabled={processing}
              className="mt-5 w-full rounded-xl bg-[#206BB0] px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60 transition"
            >
              {processing ? "Mengirim…" : "Kirim Tautan Reset"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-gray-600">
            <Link href="/user/login" className="underline">
              Kembali ke login
            </Link>
          </div>
        </div>

        {/* Footer tetap center di bawah */}
        <div className="mt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Benerin Indonesia
        </div>
      </div>
    </>
  );
}
