import React, { useState, PropsWithChildren } from "react";
import { Head, Link, usePage } from "@inertiajs/react";

// --- PALET WARNA & TIPE ---
const PRIMARY = "#206BB0";
const SECONDARY = "#FFBD59";

// --- DEFINISI TIPE ---
type AuthUser = { id: number; name: string; email: string; };

type CategoryItem = {
    slug: string;
    name: string;
    icon: string;
    description: string;
};

type PageProps = {
    auth: { user: AuthUser };
    categories: CategoryItem[];
};

// --- AppLayout (TIDAK BERUBAH) ---
function AppLayout({ user, children }: PropsWithChildren<{ user: AuthUser | null }>) {
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const initial = user?.name.charAt(0).toUpperCase() ?? 'U';

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* --- TOP NAVIGATION BAR (For Desktop & Mobile) --- */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/80">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo / Brand Name */}
                        <div className="flex-shrink-0">
                            <Link href="/" className="flex items-center gap-2 text-xl font-bold" style={{ color: PRIMARY }}>
                                <img
                                    src="/storage/assets/logo.png"
                                    alt="Benerin Indonesia"
                                    className="w-[150px] rounded object-contain"
                                />
                            </Link>
                        </div>

                        {/* Desktop Navigation Links */}
                        <nav className="hidden md:flex md:items-center md:gap-x-8">
                            <Link href="/user/home" className="flex items-center gap-2 text-sm font-semibold transition" style={{ color: PRIMARY }}>
                                <i className="fas fa-home" /> Beranda
                            </Link>
                            <Link href="/user/permintaan" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition">
                                <i className="fas fa-clipboard-list" /> Permintaan
                            </Link>
                            <Link href="/user/refund" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition">
                                <i className="fas fa-hand-holding-usd" /> Refund
                            </Link>
                        </nav>

                        {/* Profile Menu Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                onBlur={() => setTimeout(() => setIsProfileMenuOpen(false), 150)} // Close on blur
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2"
                                style={{ '--tw-ring-color': PRIMARY } as React.CSSProperties}
                            >
                                {initial}
                            </button>
                            {isProfileMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    <div className="px-4 py-2 border-b">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                    </div>
                                    <Link href="/user/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                                        <i className="fas fa-user-edit w-6 mr-1"></i> Profil Saya
                                    </Link>
                                    {/* <Link href="/user/wallet" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><i className="fas fa-wallet w-6 mr-1"></i> Wallet & Saldo</Link> */}
                                    {/* --- [BARU] --- Menu Refund di Dropdown Profil */}
                                    <Link href="/user/refund" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><i className="fas fa-hand-holding-usd w-6 mr-1"></i> Refund</Link>
                                    <Link href="/logout" method="post" as="button" className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                        <i className="fas fa-sign-out-alt w-6 mr-1"></i> Keluar
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main>{children}</main>

            {/* --- BOTTOM NAVIGATION BAR (Mobile Only) --- */}
            <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-t-lg z-30">
                {/* --- [MODIFIKASI] --- Mengubah grid menjadi 4 kolom --- */}
                <nav className="grid grid-cols-4 h-16">
                    <Link href="/user/home" className="flex flex-col items-center justify-center gap-1 text-xs font-medium" style={{ color: PRIMARY }}>
                        <i className="fas fa-home text-xl"></i>
                        <span>Beranda</span>
                    </Link>
                    <Link href="/user/permintaan" className="flex flex-col items-center justify-center gap-1 text-xs font-medium text-gray-600 hover:text-blue-600">
                        <i className="fas fa-clipboard-list text-xl"></i>
                        <span>Permintaan</span>
                    </Link>
                    {/* --- [BARU] --- Menu Refund di Navigasi Bawah (Mobile) */}
                    <Link href="/user/refund" className="flex flex-col items-center justify-center gap-1 text-xs font-medium text-gray-600 hover:text-blue-600">
                        <i className="fas fa-hand-holding-usd text-xl"></i>
                        <span>Refund</span>
                    </Link>
                    <Link href="/user/profile" className="flex flex-col items-center justify-center gap-1 text-xs font-medium text-gray-600 hover:text-blue-600">
                        <i className="fas fa-user-circle text-xl"></i>
                        <span>Profil</span>
                    </Link>
                </nav>
            </footer>

            {/* Spacer to prevent content from being hidden behind the bottom nav */}
            <div className="h-16 md:hidden"></div>
        </div>
    );
}

// --- KOMPONEN UTAMA HALAMAN KATEGORI (DESAIN SAMA DENGAN PERMINTAAN) ---
export default function Index() {
    const { auth, categories } = usePage<PageProps>().props;
    const allCategories = categories || [];

    return (
        <AppLayout user={auth.user}>
            <Head title="Pilih Kategori Servis" />
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header Halaman (SAMA PERSIS dengan halaman Permintaan) */}
                <header className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${PRIMARY}, #1a5a96)` }}>
                    <div className="absolute -right-16 -bottom-16 opacity-10"><i className="fas fa-th-large text-[16rem]"></i></div>

                    {/* Kontainer diubah menjadi flex untuk menampung tombol */}
                    <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                        {/* Grup Teks Judul */}
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Pilih Kategori Layanan</h1>
                            <p className="mt-1 max-w-2xl opacity-80">Siap memperbaiki sesuatu? Pilih salah satu layanan di bawah ini untuk memulai.</p>
                        </div>

                        <Link href="/user/permintaan/buat" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold shadow-sm transition-all duration-300 mt-3 hover:scale-105 hover:shadow-lg" style={{ color: PRIMARY }}><i className="fas fa-plus fa-xs" /> Buat Permintaan Baru</Link>
                    </div>
                </header>

                {/* Grid Daftar Kategori */}
                <div className="mt-8">
                    {allCategories.length === 0 ? (
                        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-12 text-center transition-all duration-300 hover:border-amber-400 hover:bg-amber-50/50">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ background: `linear-gradient(135deg, ${SECONDARY}30, ${SECONDARY}10)` }}>
                                <i className="fas fa-box-open fa-3x" style={{ color: SECONDARY }}></i>
                            </div>
                            <p className="mt-5 font-semibold text-gray-800">Belum Ada Kategori</p>
                            <p className="mt-1 text-sm text-gray-500">Saat ini belum ada kategori layanan yang tersedia.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {allCategories.map((category, index) => (
                                <Link
                                    href={`/user/permintaan/buat?category=${category.slug}`}
                                    key={category.slug}
                                    className="block group"
                                    style={{
                                        animationName: 'fadeInUp',
                                        animationDuration: '0.6s',
                                        animationTimingFunction: 'ease-out',
                                        animationDelay: `${index * 70}ms`,
                                        animationFillMode: 'backwards',
                                    }}
                                >
                                    {/* Kartu Desain (SAMA PERSIS dengan Kartu Permintaan) */}
                                    <div className="flex h-full flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition duration-300 ease-in-out hover:border-amber-400 hover:shadow-xl hover:-translate-y-1.5">
                                        {/* Bagian Atas Kartu */}
                                        <div>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 transition duration-300 group-hover:bg-amber-100">
                                                        <img src={category.icon} alt={category.name} className="h-7 w-7 object-contain transition-transform duration-300 group-hover:scale-110" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600">{category.name}</h3>
                                                </div>
                                                {/* Panah Aksi */}
                                                <div className="text-blue-300 transition-colors group-hover:text-amber-500">
                                                    <i className="fas fa-arrow-right fa-xs transition-transform duration-300 group-hover:translate-x-1"></i>
                                                </div>
                                            </div>
                                            <p className="mt-3 text-sm text-gray-500 leading-relaxed">{category.description}</p>
                                        </div>
                                        {/* Bagian Bawah Kartu (Call to Action) */}
                                        <div className="mt-4 border-t pt-4">
                                            <p className="text-sm font-semibold text-blue-600 group-hover:text-amber-600">
                                                Buat Permintaan Servis {category.name}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </AppLayout>
    );
}