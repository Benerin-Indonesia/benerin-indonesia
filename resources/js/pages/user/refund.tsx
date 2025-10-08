import React, { useState, useEffect, PropsWithChildren, useMemo } from "react";
import { Head, Link, usePage, router } from "@inertiajs/react";

// --- PALET WARNA & TIPE ---
const PRIMARY = "#206BB0";
const SECONDARY = "#FFBD59";

// --- FUNGSI HELPER LOKAL ---
function pickBy(obj: object): object {
    const result: { [key: string]: any } = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key]) {
            result[key] = obj[key];
        }
    }
    return result;
}

// --- DEFINISI TIPE (disesuaikan untuk Refund) ---
type AuthUser = { id: number; name: string; email: string; };

type RefundItem = {
    id: number;
    title: string;
    category: string;
    status: "requested" | "processing" | "refunded" | "failed";
    accepted_price: string | null;
    created_at: string;
};

type RefundProp = {
    data: RefundItem[];
    links: { url: string | null; label: string; active: boolean }[];
};

type PageProps = {
    auth: { user: AuthUser };
    serviceRequests: RefundProp;
    filters: {
        status: string;
        search: string;
        tanggal_mulai: string;
    }
};

// --- KOMPONEN HELPER untuk Status Refund ---
function StatusBadge({ status }: { status: RefundItem['status'] }) {
    const statusMap = {
        requested: { text: "Diajukan", icon: "fas fa-paper-plane", cls: "bg-amber-100 text-amber-800 ring-amber-200" },
        processing: { text: "Diproses", icon: "fas fa-cogs", cls: "bg-blue-100 text-blue-800 ring-blue-200" },
        refunded: { text: "Berhasil", icon: "fas fa-check-circle", cls: "bg-green-100 text-green-800 ring-green-200" },
        failed: { text: "Gagal", icon: "fas fa-times-circle", cls: "bg-red-100 text-red-800 ring-red-200" },
    };
    const { text, icon, cls } = statusMap[status] || statusMap.requested;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${cls}`}>
            <i className={icon}></i>
            <span>{text}</span>
        </span>
    );
}

// --- AppLayout (Sama seperti sebelumnya) ---
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
                            <Link href="/user/home" className="flex items-center gap-2 text-sm font-semibold transition">
                                <i className="fas fa-home" /> Beranda
                            </Link>
                            <Link href="/user/permintaan" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition">
                                <i className="fas fa-clipboard-list" /> Permintaan
                            </Link>
                            <Link href="/user/refund" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition">
                                <i className="fas fa-hand-holding-usd" style={{ color: PRIMARY }} /> Refund
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
                    <Link href="/user/home" className="flex flex-col items-center justify-center gap-1 text-xs font-medium">
                        <i className="fas fa-home text-xl"></i>
                        <span>Beranda</span>
                    </Link>
                    <Link href="/user/permintaan" className="flex flex-col items-center justify-center gap-1 text-xs font-medium text-gray-600 hover:text-blue-600">
                        <i className="fas fa-clipboard-list text-xl"></i>
                        <span>Permintaan</span>
                    </Link>
                    {/* --- [BARU] --- Menu Refund di Navigasi Bawah (Mobile) */}
                    <Link href="/user/refund" style={{ color: PRIMARY }} className="flex flex-col items-center justify-center gap-1 text-xs font-medium text-gray-600 hover:text-blue-600">
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

// --- KOMPONEN UTAMA HALAMAN ---
export default function Index() {
    const { auth, serviceRequests, filters } = usePage<PageProps>().props;

    const requests = useMemo(() => serviceRequests?.data || [], [serviceRequests]);
    const links = useMemo(() => serviceRequests?.links || [], [serviceRequests]);

    const [values, setValues] = useState({
        status: filters?.status || "",
        search: filters?.search || "",
        tanggal_mulai: filters?.tanggal_mulai || "",
    });
    const [isSearching, setIsSearching] = useState(false);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        setValues(prev => ({ ...prev, [e.target.id]: e.target.value }));
    }

    useEffect(() => {
        setIsSearching(true);
        const handler = setTimeout(() => {
            const query = pickBy(values);
            router.get(window.location.pathname, query, {
                preserveState: true,
                replace: true,
                onFinish: () => setIsSearching(false),
            });
        }, 500);
        return () => clearTimeout(handler);
    }, [values]);

    return (
        <AppLayout user={auth.user}>
            <Head title="Daftar Pengajuan Refund" />
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <header className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${PRIMARY}, #1a5a96)` }}>
                    <div className="absolute -right-16 -bottom-16 opacity-10"><i className="fas fa-hand-holding-usd text-[16rem]"></i></div>
                    <div className="relative z-10">
                        <h1 className="text-3xl font-bold tracking-tight">Pengajuan Refund Anda</h1>
                        <p className="mt-1 opacity-80">Lihat dan kelola semua riwayat pengajuan refund Anda di sini.</p>
                    </div>
                </header>

                {/* --- [MODIFIKASI] --- Panel filter dengan 3 input --- */}
                <div className="mt-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <label htmlFor="search" className="sr-only">Search</label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><i className={`fas fa-search transition-colors ${values.search ? 'text-blue-500' : 'text-gray-400'}`} /></div>
                                {isSearching && (<div className="absolute inset-y-0 right-0 flex items-center pr-3"><i className="fas fa-spinner animate-spin text-blue-500"></i></div>)}
                                <input type="text" id="search" value={values.search} onChange={handleChange} className="block w-full rounded-lg border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-10 text-sm shadow-sm focus:border-transparent focus:ring-2" placeholder="Cari berdasarkan judul..." style={{ '--tw-ring-color': SECONDARY } as React.CSSProperties} />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="status" className="sr-only">Filter Status</label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><i className={`fas fa-filter transition-colors ${values.status ? 'text-blue-500' : 'text-gray-400'}`} /></div>
                                <select id="status" value={values.status} onChange={handleChange} className="block w-full rounded-lg border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-3 text-sm shadow-sm focus:border-transparent focus:ring-2" style={{ '--tw-ring-color': SECONDARY } as React.CSSProperties}>
                                    <option value="">Semua Status</option>
                                    <option value="requested">Diajukan</option>
                                    <option value="processing">Diproses</option>
                                    <option value="refunded">Berhasil</option>
                                    <option value="failed">Gagal</option>
                                </select>
                            </div>
                        </div>
                        {/* Input filter tanggal --- */}
                        <div>
                            <label htmlFor="tanggal_mulai" className="sr-only">Tanggal Pengajuan</label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><i className={`far fa-calendar-alt transition-colors ${values.tanggal_mulai ? 'text-blue-500' : 'text-gray-400'}`} /></div>
                                <input type="date" id="tanggal_mulai" value={values.tanggal_mulai} onChange={handleChange} className="block w-full rounded-lg border-gray-200 bg-gray-50/50 py-2.5 pl-10 text-sm shadow-sm focus:border-transparent focus:ring-2" style={{ '--tw-ring-color': SECONDARY } as React.CSSProperties} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    {requests.length === 0 ? (
                        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-12 text-center transition-all duration-300 hover:border-amber-400 hover:bg-amber-50/50">
                            <div
                                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                                style={{ background: `linear-gradient(135deg, ${SECONDARY}30, ${SECONDARY}10)` }}
                            >
                                <i className="fas fa-search-dollar fa-3x" style={{ color: SECONDARY }}></i>
                            </div>
                            <p className="mt-5 font-semibold text-gray-800">
                                Tidak Ada Pengajuan Refund Ditemukan
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                                Coba ubah filter pencarian Anda atau kembali lagi nanti.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {requests.map((req, index) => (
                                <div key={req.id} className="block group" style={{ animationName: 'fadeInUp', animationDuration: '0.6s', animationTimingFunction: 'ease-out', animationDelay: `${index * 70}ms`, animationFillMode: 'backwards' }}>
                                    <div className="flex h-full flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-lg hover:border-blue-300">
                                        <div>
                                            <div className="flex items-start justify-between gap-3"><p className="text-base font-bold text-gray-800">{req.title}</p><StatusBadge status={req.status as RefundItem['status']} /></div>
                                            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500"><i className="fas fa-tag" /><span>{req.category.replace(/-/g, ' ')}</span></div>
                                        </div>
                                        <div className="mt-4 border-t pt-3">
                                            <div className="flex items-end justify-between">
                                                <div>
                                                    <p className="text-xs text-gray-500">Tanggal Pengajuan</p>
                                                    <p className="text-sm font-medium text-gray-700">{new Date(req.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                </div>
                                                <div className="text-right">
                                                    {req.accepted_price && (<p className="text-base font-bold" style={{ color: PRIMARY }}>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(parseFloat(req.accepted_price))}</p>)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-8">
                    <nav className="flex items-center justify-center">
                        <div className="flex -space-x-px rounded-md shadow-sm">
                            {links.length > 3 && links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url || '#'}
                                    className={`relative inline-flex items-center border px-4 py-2 text-sm font-semibold transition
                                        ${index === 0 ? 'rounded-l-md' : ''}
                                        ${index === links.length - 1 ? 'rounded-r-md' : ''}
                                        ${link.active ? 'z-10 border-amber-500 bg-amber-500 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}
                                        ${!link.url ? 'cursor-not-allowed text-gray-400' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </nav>
                </div>
            </div>
            <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </AppLayout>
    );
}