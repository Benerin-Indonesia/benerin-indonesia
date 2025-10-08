import React, { PropsWithChildren, useMemo, useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";

// --- PALET WARNA & TIPE KONSISTEN ---
const PRIMARY = "#206BB0";
const SECONDARY = "#FFBD59";

// --- DEFINISI TIPE SESUAI CONTROLLER ---
type AuthUser = { id: number; name: string; email: string; };

type UserData = {
    id: number;
    name: string;
};

type ScheduledJobItem = {
    id: number;
    title: string;
    scheduled_for: string;
    price_offer: string | null;
    user: UserData;
    category: string;
};

type PageProps = {
    auth: { user: AuthUser };
    scheduledJobs: Record<string, ScheduledJobItem[]>;
};

// --- APP LAYOUT (KONSISTEN DENGAN LINK YANG BENAR) ---
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
                                className="w-[150px] rounded object-contain" />
                        </Link>
                        <nav className="hidden md:flex md:items-center md:gap-x-8">
                            <Link href="/teknisi/home" className="flex items-center gap-2 text-sm font-semibold"><i className="fas fa-home" /> Beranda</Link>
                            <Link href="/teknisi/permintaan" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"><i className="fas fa-briefcase" /> Pekerjaan</Link>
                            <Link href="/teknisi/jadwal" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900" style={{ color: PRIMARY }}><i className="fas fa-calendar-alt" /> Jadwal</Link>
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
                    <Link href="/teknisi/jadwal" className="flex flex-col items-center justify-center gap-1 text-xs text-gray-600"><i className="fas fa-calendar-alt text-xl" style={{ color: PRIMARY }}></i><span>Jadwal</span></Link>
                    <Link href="/teknisi/profile" className="flex flex-col items-center justify-center gap-1 text-xs text-gray-600"><i className="fas fa-user-circle text-xl"></i><span>Profil</span></Link>
                </nav>
            </footer>
            <div className="h-16 md:hidden"></div>
        </div>
    );
}


// --- Komponen-komponen UI yang Ramping & Elegan ---

function MinimalJobCard({ job, animationDelay }: { job: ScheduledJobItem, animationDelay: number }) {
    const formatRupiah = (angka: string | null) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(parseFloat(angka || '0'));
    const time = new Date(job.scheduled_for).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    return (
        <Link
            href={`/teknisi/permintaan/${job.id}`}
            className="block group"
            style={{
                animationName: 'fadeInUp',
                animationDuration: '0.5s',
                animationTimingFunction: 'ease-out',
                animationDelay: `${animationDelay}ms`,
                animationFillMode: 'backwards',
            }}
        >
            <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-200 bg-white transition-all duration-300 ease-in-out group-hover:shadow-lg group-hover:border-blue-400 group-hover:scale-[1.02]">
                <div className="flex flex-col items-center justify-center text-center w-16 flex-shrink-0">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 border border-blue-100 transition-colors group-hover:bg-blue-100">
                        <i className="fas fa-wrench text-lg" style={{ color: PRIMARY }}></i>
                    </div>
                    <p className="mt-2 text-sm font-bold" style={{ color: PRIMARY }}>{time}</p>
                </div>
                <div className="w-px h-16 bg-gray-200"></div>
                <div className="flex-grow">
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: PRIMARY, opacity: 0.8 }}>{job.category}</p>
                    <h3 className="text-base font-bold text-gray-900">{job.title}</h3>
                    <div className="mt-2 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                            <i className="fas fa-user-circle text-gray-400"></i>
                            <span>{job.user.name}</span>
                        </div>
                        <p className="font-bold text-gray-800">{formatRupiah(job.price_offer)}</p>
                    </div>
                </div>
                <div className="flex-shrink-0 text-gray-300 transition-transform duration-300 group-hover:translate-x-1">
                    <i className="fas fa-chevron-right"></i>
                </div>
            </div>
        </Link>
    );
}

// --- [BARU] --- Komponen Sidebar yang Dikembalikan ---
function ScheduleSummary({ jobsToday, todayKey }: { jobsToday: ScheduledJobItem[], todayKey: string }) {
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long' });
    return (
        <div className="sticky top-24 space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">Ringkasan Hari Ini</h3>
                <p className="text-sm text-gray-500 mb-4">{formatDate(todayKey)}</p>
                {jobsToday.length > 0 ? (
                    <ul className="space-y-4">
                        {jobsToday.map(job => (
                            <li key={job.id} className="flex items-center gap-3 text-sm p-3 rounded-lg bg-gray-50 border border-gray-100">
                                <span className="font-bold" style={{ color: PRIMARY }}>{new Date(job.scheduled_for).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="flex-grow text-gray-700 truncate font-medium">{job.title}</span>
                                <Link href={`/teknisi/permintaan/${job.id}`}><i className="fas fa-chevron-right text-gray-400 hover:text-blue-600"></i></Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-center text-gray-500 py-6">Tidak ada tugas untuk hari ini. Waktunya bersantai! ☕</p>
                )}
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-4">
                    <div className="mt-1 flex-shrink-0">
                        <i className="fas fa-exclamation-triangle text-amber-500 text-lg"></i>
                    </div>
                    <div>
                        <h4 className="font-bold text-amber-900">Komitmen</h4>
                        <p className="text-sm mt-1 text-amber-800">
                            Selalu hubungi pelanggan sebelum berangkat untuk konfirmasi alamat dan kehadiran.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}


// --- KOMPONEN UTAMA HALAMAN ---
export default function IndexJadwal() {
    const { auth, scheduledJobs } = usePage<PageProps>().props;
    const dateKeys = useMemo(() => Object.keys(scheduledJobs).sort(), [scheduledJobs]);
    const todayKey = useMemo(() => new Date().toISOString().split('T')[0], []);
    const jobsToday = scheduledJobs[todayKey] || [];
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <TechnicianAppLayout user={auth.user}>
            <Head title="Jadwal Pekerjaan" />
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* --- [MODIFIKASI] --- Header dengan warna solid, tanpa gradient --- */}
                <header
                    className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg"
                    style={{ backgroundColor: PRIMARY }}
                >
                    <div className="absolute -right-10 -top-10 opacity-10"><i className="fas fa-calendar-check text-[18rem] text-white transform -rotate-12"></i></div>
                    <div className="relative z-10">
                        <h1 className="text-3xl font-bold tracking-tight">Jadwal Pekerjaan Anda</h1>
                        <p className="mt-2 max-w-2xl text-white/80">Pekerjaan yang telah dikonfirmasi dan siap dieksekusi.</p>
                    </div>
                </header>

                {/* --- [MODIFIKASI] --- Layout 2 kolom dikembalikan --- */}
                <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Kolom Utama: Linimasa Jadwal */}
                    <div className="lg:col-span-2">
                        {dateKeys.length === 0 ? (
                            <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center h-full flex flex-col justify-center items-center" style={{ minHeight: '40vh' }}>
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                                    <i className="fas fa-check-circle fa-3x text-green-500"></i>
                                </div>
                                <p className="mt-5 font-semibold text-gray-800">Jadwal Anda Kosong</p>
                                <p className="mt-1 text-sm text-gray-500">Nikmati waktu luang Anda. Belum ada pekerjaan yang dijadwalkan.</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {dateKeys.map(date => (
                                    <div key={date}>
                                        <div className="flex items-center gap-3 mb-4 px-2">
                                            <i className="fas fa-calendar-day" style={{ color: SECONDARY }}></i>
                                            <h2 className="text-lg font-bold text-gray-800">{formatDate(date)}</h2>
                                            <div className="h-px flex-grow bg-gray-200 ml-2"></div>
                                        </div>
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                            {scheduledJobs[date].map((job, index) => (
                                                <MinimalJobCard key={job.id} job={job} animationDelay={index * 100} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Kolom Samping: Ringkasan & Info */}
                    <div className="hidden lg:block">
                        <ScheduleSummary jobsToday={jobsToday} todayKey={todayKey} />
                    </div>
                </div>
            </div>
        </TechnicianAppLayout>
    );
}