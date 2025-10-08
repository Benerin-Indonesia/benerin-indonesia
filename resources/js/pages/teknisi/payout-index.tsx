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

// --- DEFINISI TIPE (disesuaikan untuk Payout) ---
type AuthUser = { id: number; name: string; email: string; };
type Status = "pending" | "paid" | "rejected";

// Strukturnya dibuat sama seperti TechnicianJobItem agar komponen bisa dipakai ulang
type PayoutItem = {
    id: number;
    title: string;
    category: string;
    scheduled_for: string | null; // Untuk tanggal pembayaran
    status: Status;
    price_offer: string | null; // Untuk jumlah
};

type PaginatedResponse<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
};

type PageProps = {
    auth: { user: AuthUser };
    incoming: PaginatedResponse<PayoutItem>; // Kita tetap gunakan nama 'incoming'
    filters: {
        status: string;
        search: string;
        tanggal_mulai: string;
    }
};

// --- [MODIFIKASI] KOMPONEN HELPER untuk Status Payout ---
function StatusBadge({ status }: { status: Status }) {
    const statusMap = {
        pending: { text: "Pending", icon: "fas fa-hourglass-half", cls: "bg-amber-100 text-amber-800 ring-amber-200" },
        paid: { text: "Dibayar", icon: "fas fa-check-circle", cls: "bg-green-100 text-green-800 ring-green-200" },
        rejected: { text: "Ditolak", icon: "fas fa-times-circle", cls: "bg-red-100 text-red-800 ring-red-200" },
    };
    const { text, icon, cls } = statusMap[status] || statusMap.pending;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${cls}`}>
            <i className={icon}></i>
            <span>{text}</span>
        </span>
    );
}

// --- AppLayout ---
function TechnicianAppLayout({ user, children }: PropsWithChildren<{ user: AuthUser | null }>) {
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const initial = user?.name.charAt(0).toUpperCase() ?? 'T';

    return (
        <div className="min-h-screen bg-gray-100/50">
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/80">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link href="/" className="flex items-center gap-2 text-xl font-bold" style={{ color: PRIMARY }}>
                            <img
                                src="/storage/assets/logo.png"
                                alt="Benerin Indonesia"
                                className="w-[150px] rounded object-contain"
                            />
                        </Link>
                        <nav className="hidden md:flex md:items-center md:gap-x-8">
                            <Link href="/teknisi/home" className="flex items-center gap-2 text-sm font-semibold"><i className="fas fa-home" /> Beranda</Link>
                            <Link href="/teknisi/permintaan" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"><i className="fas fa-briefcase" /> Pekerjaan</Link>
                            <Link href="/teknisi/jadwal" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"><i className="fas fa-calendar-alt" /> Jadwal</Link>
                        </nav>
                        <div className="relative">
                            <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} onBlur={() => setTimeout(() => setIsProfileMenuOpen(false), 150)} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2" style={{ '--tw-ring-color': PRIMARY } as React.CSSProperties}>
                                {initial}
                            </button>
                            {isProfileMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    <div className="px-4 py-2 border-b"><p className="text-sm font-semibold truncate">{user?.name}</p><p className="text-xs text-gray-500 truncate">{user?.email}</p></div>
                                    <Link href="/teknisi/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><i className="fas fa-user-edit w-6 mr-1"></i> Profil Saya</Link>
                                    <Link href="/teknisi/wallet" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><i className="fas fa-wallet w-6 mr-1"></i> Wallet & Saldo</Link>
                                    <Link href="/teknisi/pencairan-dana" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <i className="fas fa-money-bill-wave w-6 mr-1"></i> Pencairan Dana
                                    </Link>
                                    <Link href="/logout" method="post" as="button" className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"><i className="fas fa-sign-out-alt w-6 mr-1"></i> Keluar</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            <main>{children}</main>
            <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-30">
                <nav className="grid grid-cols-4 h-16">
                    <Link href="/teknisi/home" className="flex flex-col items-center justify-center gap-1 text-xs"><i className="fas fa-home text-xl"></i><span>Beranda</span></Link>
                    <Link href="/teknisi/permintaan" className="flex flex-col items-center justify-center gap-1 text-xs text-gray-600"><i className="fas fa-briefcase text-xl"></i><span>Pekerjaan</span></Link>
                    <Link href="/teknisi/jadwal" className="flex flex-col items-center justify-center gap-1 text-xs text-gray-600"><i className="fas fa-calendar-alt text-xl"></i><span>Jadwal</span></Link>
                    <Link href="/teknisi/profile" className="flex flex-col items-center justify-center gap-1 text-xs text-gray-600"><i className="fas fa-user-circle text-xl"></i><span>Profil</span></Link>
                </nav>
            </footer>
            <div className="h-16 md:hidden"></div>
        </div>
    );
}

// --- KOMPONEN UTAMA HALAMAN ---
export default function Index() {
    const { auth, incoming, filters } = usePage<PageProps>().props;

    const payouts = useMemo(() => incoming.data, [incoming]);
    const links = useMemo(() => incoming.links, [incoming]);

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
            router.get(window.location.pathname, query, { preserveState: true, replace: true, onFinish: () => setIsSearching(false) });
        }, 500);
        return () => clearTimeout(handler);
    }, [values]);

    return (
        <TechnicianAppLayout user={auth.user}>
            <Head title="Riwayat Pencairan Dana" />
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <header className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${PRIMARY}, #1a5a96)` }}>
                    <div className="absolute -right-16 -bottom-16 opacity-10"><i className="fas fa-history text-[16rem]"></i></div>
                    <div className="relative z-10">
                        <h1 className="text-3xl font-bold tracking-tight">Riwayat Pencairan Dana</h1>
                        <p className="mt-1 opacity-80">Kelola dan lihat semua riwayat penarikan saldo Anda.</p>
                    </div>
                </header>

                <div className="mt-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="sm:col-span-2 lg:col-span-1">
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><i className={`fas fa-search transition-colors ${values.search ? 'text-blue-500' : 'text-gray-400'}`} /></div>
                                {isSearching && (<div className="absolute inset-y-0 right-0 flex items-center pr-3"><i className="fas fa-spinner animate-spin text-blue-500"></i></div>)}
                                <input type="number" id="search" value={values.search} onChange={handleChange} className="block w-full rounded-lg border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-10 text-sm shadow-sm focus:border-transparent focus:ring-2" placeholder="Cari berdasarkan jumlah..." style={{ '--tw-ring-color': SECONDARY } as React.CSSProperties} />
                            </div>
                        </div>
                        <div>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><i className={`fas fa-filter transition-colors ${values.status ? 'text-blue-500' : 'text-gray-400'}`} /></div>
                                <select id="status" value={values.status} onChange={handleChange} className="block w-full rounded-lg border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-3 text-sm shadow-sm focus:border-transparent focus:ring-2" style={{ '--tw-ring-color': SECONDARY } as React.CSSProperties}>
                                    <option value="">Semua Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="paid">Dibayar</option>
                                    <option value="rejected">Ditolak</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><i className={`far fa-calendar-alt transition-colors ${values.tanggal_mulai ? 'text-blue-500' : 'text-gray-400'}`} /></div>
                                <input type="date" id="tanggal_mulai" value={values.tanggal_mulai} onChange={handleChange} className="block w-full rounded-lg border-gray-200 bg-gray-50/50 py-2.5 pl-10 text-sm shadow-sm focus:border-transparent focus:ring-2" style={{ '--tw-ring-color': SECONDARY } as React.CSSProperties} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    {payouts.length === 0 ? (
                        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-12 text-center transition-all duration-300 hover:border-amber-400 hover:bg-amber-50/50">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ background: `linear-gradient(135deg, ${SECONDARY}30, ${SECONDARY}10)` }}><i className="fas fa-search-dollar fa-3x" style={{ color: SECONDARY }}></i></div>
                            <p className="mt-5 font-semibold text-gray-800">Tidak Ada Data Ditemukan</p>
                            <p className="mt-1 text-sm text-gray-500">Hasil filter tidak ditemukan atau Anda belum pernah melakukan pencairan dana.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {payouts.map((payout, index) => (
                                <div key={payout.id} className="block group" style={{ animationName: 'fadeInUp', animationDuration: '0.6s', animationTimingFunction: 'ease-out', animationDelay: `${index * 70}ms`, animationFillMode: 'backwards' }}>
                                    <div className="flex h-full flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition duration-300 ease-in-out hover:border-blue-400 hover:shadow-lg">
                                        <div>
                                            <div className="flex items-start justify-between gap-3">
                                                <p className="text-base font-bold text-gray-800">{payout.title}</p>
                                                <StatusBadge status={payout.status} />
                                            </div>
                                            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500"><i className="fas fa-university" /><span>{payout.category}</span></div>
                                        </div>
                                        <div className="mt-4 border-t pt-3">
                                            <div className="flex items-end justify-between">
                                                <div>
                                                    <p className="text-xs text-gray-500">{payout.status === 'paid' ? 'Dibayar Pada' : 'Diajukan Pada'}</p>
                                                    <p className="text-sm font-medium text-gray-700">
                                                        {payout.status === 'paid' && payout.scheduled_for
                                                            ? new Date(payout.scheduled_for).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })
                                                            : new Date(payout.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })
                                                        }
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    {payout.price_offer && (<p className="text-base font-bold" style={{ color: PRIMARY }}>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(parseFloat(payout.price_offer))}</p>)}
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
        </TechnicianAppLayout>
    );
}