import React from "react";
import { Head, useForm, Link } from "@inertiajs/react";

type Props = {
  token: string;
  email?: string;
};

export default function AdminResetPassword({ token, email }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    token: token ?? "",
    email: email ?? "",
    password: "",
    password_confirmation: "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    post("/reset-password");
  }

  return (
    <>
      <Head title="Reset Password Admin" />
      <div className="min-h-screen grid place-items-center bg-gray-50 px-4">
        <form
          onSubmit={submit}
          className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <h1 className="text-lg font-semibold text-gray-900">Atur Ulang Kata Sandi</h1>
          <p className="mt-1 text-sm text-gray-600">
            Masukkan password baru untuk akun Anda.
          </p>

          <input type="hidden" name="token" value={data.token} />

          <div className="mt-4">
            <label className="text-sm text-gray-700">Email</label>
            <input
              type="email"
              value={data.email}
              onChange={(e) => setData("email", e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
              required
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          <div className="mt-3">
            <label className="text-sm text-gray-700">Password Baru</label>
            <input
              type="password"
              value={data.password}
              onChange={(e) => setData("password", e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
              required
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>

          <div className="mt-3">
            <label className="text-sm text-gray-700">Konfirmasi Password</label>
            <input
              type="password"
              value={data.password_confirmation}
              onChange={(e) => setData("password_confirmation", e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
              required
            />
          </div>

          <button
            type="submit"
            disabled={processing}
            className="mt-5 w-full rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
          >
            {processing ? "Memproses…" : "Simpan Password"}
          </button>

          <div className="mt-4 text-center text-sm text-gray-600">
            <Link href="/admin/login" className="underline">Kembali ke login</Link>
          </div>
        </form>
      </div>
    </>
  );
}
