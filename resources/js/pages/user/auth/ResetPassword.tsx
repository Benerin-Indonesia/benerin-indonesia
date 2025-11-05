import React from "react";
import { Head, useForm, Link } from "@inertiajs/react";

type Props = {
  token: string;
  email?: string;
};

export default function ResetPassword({ token, email }: Props) {
  const { data, setData, post, processing, errors, reset } = useForm({
    token: token ?? "",
    email: email ?? "",
    password: "",
    password_confirmation: "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    post("/user/reset-password", {
      onSuccess: () => reset("password", "password_confirmation"),
    });
  }

  return (
    <>
      <Head title="Atur Ulang Password" />
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img src="/storage/assets/logo.png" alt="Benerin Indonesia" className="h-12 w-auto" />
          </div>

          <h1 className="text-xl font-semibold text-center text-gray-900">Atur Ulang Password</h1>
          <p className="mt-1 text-sm text-center text-gray-600">
            Buat password baru untuk akun Anda.
          </p>

          {/* token hidden */}
          <input type="hidden" name="token" value={data.token} />

          <form onSubmit={submit} className="mt-5">
            <label htmlFor="email" className="text-sm text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => setData("email", e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#206BB0]/30"
              placeholder="nama@contoh.com"
              required
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}

            <div className="mt-4">
              <label htmlFor="password" className="text-sm text-gray-700">Password Baru</label>
              <input
                id="password"
                type="password"
                value={data.password}
                onChange={(e) => setData("password", e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#206BB0]/30"
                required
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>

            <div className="mt-4">
              <label htmlFor="password_confirmation" className="text-sm text-gray-700">
                Konfirmasi Password
              </label>
              <input
                id="password_confirmation"
                type="password"
                value={data.password_confirmation}
                onChange={(e) => setData("password_confirmation", e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#206BB0]/30"
                required
              />
            </div>

            <button
              type="submit"
              disabled={processing}
              className="mt-5 w-full rounded-xl bg-[#206BB0] px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60 transition"
            >
              {processing ? "Menyimpan…" : "Simpan Password"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-gray-600">
            <Link href="/user/login" className="underline">Kembali ke login</Link>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Benerin Indonesia
        </div>
      </div>
    </>
  );
}
