import React, { PropsWithChildren, useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";

// --- DEFINISI WARNA & TIPE ---
const PRIMARY = "#206BB0"; // Biru
const SECONDARY = "#FFBD59"; // Kuning

// Tipe untuk data user, agar AppLayout lebih aman
interface AuthUser {
    name: string;
    email: string;
}

// --- NEW COMPONENT: Application Layout with Responsive Navbar ---
function AppLayout({ user, children }: PropsWithChildren<{ user: AuthUser | null }>) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const initial = user?.name.charAt(0).toUpperCase() ?? 'U';

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* --- TOP NAVIGATION BAR (Untuk Desktop & Mobile) --- */}
      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/80 shadow-sm backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/user/home" className="flex items-center gap-2 text-xl font-bold" style={{ color: PRIMARY }}>
                 <img
                  src="/storage/assets/logo.png"
                  alt="Benerin Indonesia"
                  className="w-[150px] rounded object-contain"
                />
              </Link>
            </div>

            {/* Navigasi Desktop */}
            <nav className="hidden md:flex md:items-center md:gap-x-8">
              <Link href="/user/home" className="flex items-center gap-2 text-sm font-semibold transition" style={{ color: PRIMARY }}>
                <i className="fas fa-home" /> Beranda
              </Link>
              <Link href="/user/permintaan" className="flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-gray-900">
                <i className="fas fa-clipboard-list" /> Permintaan
              </Link>
            </nav>

            {/* Menu Profil Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                onBlur={() => setTimeout(() => setIsProfileMenuOpen(false), 150)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ '--tw-ring-color': PRIMARY } as React.CSSProperties}
              >
                {initial}
              </button>
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="border-b px-4 py-2">
                    <p className="truncate text-sm font-semibold text-gray-900">{user?.name}</p>
                    <p className="truncate text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <Link href="/profile" className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                    <i className="fas fa-user-edit mr-1 w-6"></i> Profil Saya
                  </Link>
                  <Link href="/logout" method="post" as="button" className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                    <i className="fas fa-sign-out-alt mr-1 w-6"></i> Keluar
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Konten Utama */}
      <main>{children}</main>

      {/* --- BOTTOM NAVIGATION BAR (Hanya Mobile) --- */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white shadow-t-lg md:hidden">
        <nav className="grid h-16 grid-cols-3">
          <Link href="/user/home" className="flex flex-col items-center justify-center gap-1 text-xs font-medium" style={{ color: PRIMARY }}>
            <i className="fas fa-home text-xl"></i>
            <span>Beranda</span>
          </Link>
          <Link href="/user/permintaan" className="flex flex-col items-center justify-center gap-1 text-xs font-medium text-gray-600 hover:text-blue-600">
            <i className="fas fa-clipboard-list text-xl"></i>
            <span>Permintaan</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center justify-center gap-1 text-xs font-medium text-gray-600 hover:text-blue-600">
            <i className="fas fa-user-circle text-xl"></i>
            <span>Profil</span>
          </Link>
        </nav>
      </footer>
      
      {/* Spacer agar konten tidak tertutup nav bawah di mobile */}
      <div className="h-16 md:hidden"></div>
    </div>
  );
}

// --- HALAMAN UTAMA: Form Pembuatan Permintaan ---
export default function Buat({ auth, initialCategory, categories }) {
    const { data, setData, post, processing, errors } = useForm({
        category: initialCategory,
        title: "",
        description: "",
        scheduled_for: "",
        error_notif: ""
    });

    const submit = (e) => {
        e.preventDefault();
        post("/user/permintaan/simpan");
    };

    return (
        <AppLayout user={auth.user}>
            <Head title="Buat Permintaan Servis Baru" />

            <div className="px-4 py-12 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl"> {/* Sedikit diperlebar untuk menampung padding baru */}
                    
                    <div 
                        className="overflow-hidden border rounded-xl border-t-4 bg-white shadow-md"
                        style={{ borderTopColor: PRIMARY }}
                    >
                        {/* Header Card */}
                        <div className="border-b border-gray-200 bg-white px-6 py-5 sm:px-8">
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                Buat Permintaan Servis Baru
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Lengkapi detail di bawah ini untuk menjadwalkan perbaikan perangkat Anda.
                            </p>
                        </div>
                        
                        {/* Form Body */}
                        <form onSubmit={submit} className="p-6 sm:p-8">
                            {/* Banner Informasi */}
                             <div className="mb-8 flex items-start gap-3 rounded-lg bg-yellow-50 p-4 text-yellow-900">
                                <i className="fas fa-info-circle mt-0.5 text-yellow-500"></i>
                                <div className="text-sm">
                                    <p className="font-semibold">Tips Pengisian</p>
                                    <p className="mt-1">Deskripsi yang detail akan membantu teknisi kami memahami masalah lebih cepat sebelum kunjungan.</p>
                                </div>
                            </div>

                            {/* Notifikasi Error Global */}
                            {errors.error_notif && (
                                <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700" role="alert">
                                    {errors.error_notif}
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* Kategori */}
                                <div className="rounded-xl border border-gray-200 p-5 shadow-sm md:col-span-1">
                                    <label htmlFor="category" className="block text-sm font-medium leading-6 text-gray-700">Kategori Perangkat</label>
                                    <div className="relative mt-2">
                                         <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <i className="fas fa-tag text-gray-400" />
                                        </div>
                                        <select
                                            id="category"
                                            value={data.category}
                                            onChange={(e) => setData("category", e.target.value)}
                                            className="block w-full rounded-lg border-gray-300 bg-gray-50/50 py-2.5 pl-10 pr-3 text-sm shadow-sm focus:border-transparent focus:ring-2"
                                            style={{'--tw-ring-color': SECONDARY} as React.CSSProperties}
                                        >
                                            <option value="">-- Pilih kategori --</option>
                                            {categories.map((c) => (
                                                <option key={c.slug} value={c.slug}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {errors.category && <p className="mt-1.5 text-sm text-red-600">{errors.category}</p>}
                                </div>

                                {/* Jadwal */}
                                <div className="rounded-xl border border-gray-200 p-5 shadow-sm md:col-span-1">
                                    <label htmlFor="scheduled_for" className="block text-sm font-medium leading-6 text-gray-700">Jadwal Kunjungan</label>
                                    <div className="relative mt-2">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <i className="fas fa-calendar-alt text-gray-400" />
                                        </div>
                                        <input
                                            type="datetime-local"
                                            id="scheduled_for"
                                            value={data.scheduled_for}
                                            onChange={(e) => setData("scheduled_for", e.target.value)}
                                            className="block w-full rounded-lg border-gray-300 bg-gray-50/50 py-2 pl-10 pr-3 text-sm shadow-sm focus:border-transparent focus:ring-2"
                                            style={{'--tw-ring-color': SECONDARY} as React.CSSProperties}
                                        />
                                    </div>
                                    {errors.scheduled_for && <p className="mt-1.5 text-sm text-red-600">{errors.scheduled_for}</p>}
                                </div>

                                {/* Judul */}
                                <div className="rounded-xl border border-gray-200 p-5 shadow-sm md:col-span-2">
                                    <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-700">Judul Permintaan</label>
                                    <div className="relative mt-2">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <i className="fas fa-heading text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            id="title"
                                            value={data.title}
                                            onChange={(e) => setData("title", e.target.value)}
                                            className="block w-full rounded-lg border-gray-300 bg-gray-50/50 py-2.5 pl-10 pr-3 text-sm shadow-sm focus:border-transparent focus:ring-2"
                                            placeholder="Contoh: AC tidak dingin sama sekali"
                                            style={{'--tw-ring-color': SECONDARY} as React.CSSProperties}
                                        />
                                    </div>
                                    {errors.title && <p className="mt-1.5 text-sm text-red-600">{errors.title}</p>}
                                </div>

                                {/* Deskripsi */}
                                <div className="rounded-xl border border-gray-200 p-5 shadow-sm md:col-span-2">
                                    <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-700">Deskripsi Masalah</label>
                                    <div className="mt-2">
                                        <textarea
                                            id="description"
                                            rows={5}
                                            value={data.description}
                                            onChange={(e) => setData("description", e.target.value)}
                                            className="block w-full rounded-lg border-gray-300 bg-gray-50/50 p-3 text-sm shadow-sm focus:border-transparent focus:ring-2"
                                            placeholder="Jelaskan secara rinci kerusakan yang terjadi, seperti kapan masalah muncul, gejala yang ada, atau merk dan tipe perangkat jika diketahui."
                                            style={{'--tw-ring-color': SECONDARY} as React.CSSProperties}
                                        />
                                    </div>
                                    {errors.description && <p className="mt-1.5 text-sm text-red-600">{errors.description}</p>}
                                </div>
                            </div>

                            {/* Tombol Aksi */}
                            <div className="mt-10 flex items-center justify-end gap-x-4 border-t border-gray-200 pt-6">
                                <Link
                                    href="/user/home"
                                    className="border-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
                                >
                                    Batal
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                    style={{ backgroundColor: PRIMARY }}
                                >
                                    {processing ? (
                                        <>
                                            <i className="fas fa-spinner animate-spin" />
                                            <span>Memproses...</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-paper-plane" />
                                            <span>Kirim Permintaan</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}