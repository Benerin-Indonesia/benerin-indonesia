import React, { useState, PropsWithChildren } from "react";
import { Head, Link, usePage } from "@inertiajs/react";

// --- PALET WARNA & TIPE KONSISTEN ---
const PRIMARY = "#206BB0";
const SECONDARY = "#FFBD59";

// --- DEFINISI TIPE SESUAI DATA DARI CONTROLLER ---
type AuthUser = { id: number; name: string; email: string; };

type UserProfile = {
    name: string;
    bank_name: string | null;
    account_name: string | null;
    account_number: string | null;
};

type PageProps = {
    auth: { user: AuthUser };
    totalBalance: number;
    userProfile: UserProfile;
};

// --- FUNGSI HELPER ---
const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);

// --- APP LAYOUT (LENGKAP DAN KONSISTEN) ---
function TechnicianAppLayout({ user, children }: PropsWithChildren<{ user: AuthUser | null }>) {
    const { url } = usePage();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const initial = user?.name.charAt(0).toUpperCase() ?? 'T';
    const isActive = (path: string) => url.startsWith(path);
    
    // Logika active link yang presisi
    const isDashboardActive = url === '/teknisi/home';
    const isPekerjaanActive = isActive('/teknisi/permintaan');
    const isJadwalActive = isActive('/teknisi/jadwal');
    const isWalletActive = isActive('/teknisi/wallet');
    const isPencairanActive = isActive('/teknisi/pencairan-dana');
    const isProfileActive = isActive('/teknisi/profile');

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/80">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link href="/teknisi/home"><img src="/storage/assets/logo.png" alt="Benerin Indonesia" className="w-[150px] rounded object-contain" /></Link>
                        <nav className="hidden md:flex md:items-center md:gap-x-8">
                            <Link href="/teknisi/home" className={`flex items-center gap-2 text-sm font-semibold transition ${isDashboardActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}><i className="fas fa-home" /> Beranda</Link>
                            <Link href="/teknisi/permintaan" className={`flex items-center gap-2 text-sm font-semibold transition ${isPekerjaanActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}><i className="fas fa-briefcase" /> Pekerjaan</Link>
                            <Link href="/teknisi/jadwal" className={`flex items-center gap-2 text-sm font-semibold transition ${isJadwalActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}><i className="fas fa-calendar-alt" /> Jadwal</Link>
                            {/* <Link href="/teknisi/pencairan-dana" className={`flex items-center gap-2 text-sm font-semibold transition ${isPencairanActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}><i className="fas fa-money-bill-wave" /> Pencairan</Link> */}
                        </nav>
                        <div className="relative">
                            <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} onBlur={() => setTimeout(() => setIsProfileMenuOpen(false), 150)} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2" style={{ '--tw-ring-color': SECONDARY } as React.CSSProperties}>{initial}</button>
                            {isProfileMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    <div className="px-4 py-2 border-b"><p className="text-sm font-semibold truncate">{user?.name}</p><p className="text-xs text-gray-500 truncate">{user?.email}</p></div>
                                    <Link href="/teknisi/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><i className="fas fa-user-edit w-6 mr-1"></i> Profil Saya</Link>
                                    <Link href="/teknisi/wallet" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><i className="fas fa-wallet w-6 mr-1"></i> Wallet & Saldo</Link>
                                    <Link href="/teknisi/pencairan-dana" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><i className="fas fa-money-bill-wave w-6 mr-1"></i> Pencairan Dana</Link>
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
                    <Link href="/teknisi/home" className={`flex flex-col items-center justify-center gap-1 text-xs font-medium ${isDashboardActive ? 'text-blue-600' : 'text-gray-600'}`}><i className="fas fa-home text-xl"></i><span>Beranda</span></Link>
                    <Link href="/teknisi/permintaan" className={`flex flex-col items-center justify-center gap-1 text-xs font-medium ${isPekerjaanActive ? 'text-blue-600' : 'text-gray-600'}`}><i className="fas fa-briefcase text-xl"></i><span>Pekerjaan</span></Link>
                    <Link href="/teknisi/jadwal" className={`flex flex-col items-center justify-center gap-1 text-xs font-medium ${isJadwalActive ? 'text-blue-600' : 'text-gray-600'}`}><i className="fas fa-calendar-alt text-xl"></i><span>Jadwal</span></Link>
                    {/* <Link href="/teknisi/wallet" className={`flex flex-col items-center justify-center gap-1 text-xs font-medium ${isPencairanActive ? 'text-blue-600' : 'text-gray-600'}`}><i className="fas fa-money-bill-wave text-xl"></i><span>Cairkan</span></Link> */}
                    <Link href="/teknisi/profile" className={`flex flex-col items-center justify-center gap-1 text-xs font-medium ${isProfileActive ? 'text-blue-600' : 'text-gray-600'}`}><i className="fas fa-user-circle text-xl"></i><span>Profil</span></Link>
                </nav>
            </footer>
            <div className="h-16 md:hidden"></div>
        </div>
    );
}

// --- Komponen Info Item untuk detail bank yang rapi ---
function InfoItem({ icon, label, value }: { icon: string, label: string, value: string | null }) {
    return (
        <div className="flex items-start gap-4">
            <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-gray-100 text-gray-500">
                <i className={`fas ${icon}`}></i>
            </div>
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="font-semibold text-gray-800 tracking-wider">{value || '-'}</p>
            </div>
        </div>
    );
}

// --- KOMPONEN UTAMA HALAMAN WALLET ---
export default function Wallet() {
    const { auth, totalBalance, userProfile } = usePage<PageProps>().props;

    const isBankDetailsComplete = !!(userProfile.bank_name && userProfile.account_name && userProfile.account_number);

    return (
        <TechnicianAppLayout user={auth.user}>
            <Head title="Wallet & Saldo" />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <header 
                    className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg"
                    style={{ backgroundColor: PRIMARY }}
                >
                    <div className="absolute -right-10 -top-10 opacity-10"><i className="fas fa-wallet text-[18rem] text-white transform -rotate-12"></i></div>
                    <div className="relative z-10">
                        <h1 className="text-3xl font-bold tracking-tight">Wallet & Saldo</h1>
                        <p className="mt-1 max-w-2xl text-white/80">Kelola pendapatan dan informasi pencairan dana Anda di sini.</p>
                    </div>
                </header>

                <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-5">
                    {/* Kolom Kiri: Saldo & Aksi */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* --- KARTU SALDO UTAMA --- */}
                        <div
                            className="relative overflow-hidden rounded-2xl p-6 text-gray-800 shadow-xl"
                            style={{ background: `linear-gradient(135deg, #FFFBEB, #FEF3C7)`}} // Soft Gradient: Amber-50 to Amber-100
                        >
                            <div className="absolute -right-12 -bottom-12 opacity-20">
                                <i className="fas fa-coins text-[12rem] text-amber-900/50 transform -rotate-12"></i>
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/60">
                                        <i className="fas fa-wallet text-xl" style={{color: '#b45309'}}></i>
                                    </div>
                                    <p className="font-bold text-amber-900/80">Saldo Tersedia</p>
                                </div>
                                <p className="mt-4 text-5xl font-bold tracking-tight text-amber-900">
                                    {formatRupiah(totalBalance)}
                                </p>
                                <p className="mt-2 text-sm text-amber-900/70">Siap untuk ditarik ke rekening Anda</p>
                            </div>
                        </div>
                        
                        {/* --- TOMBOL AKSI --- */}
                        <div className="space-y-3">
                             <Link 
                                href="/teknisi/withdraw/create"
                                as="button"
                                disabled={!isBankDetailsComplete}
                                className="group flex w-full items-center justify-center gap-3 rounded-xl bg-[#206BB0] px-6 py-4 text-base font-bold text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#0056b3] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none disabled:hover:scale-100"
                            >
                                <i className="fas fa-paper-plane"></i>
                                <span>Ajukan Pencairan Dana</span>
                            </Link>
                            {/* <Link 
                                href="/teknisi/riwayat-transaksi"
                                className="group flex w-full items-center justify-center gap-3 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm border border-gray-200 transition-all duration-300 hover:bg-gray-50 hover:border-gray-300"
                            >
                                <i className="fas fa-history text-gray-400"></i>
                                <span>Lihat Riwayat Transaksi</span>
                            </Link> */}
                        </div>
                    </div>

                    {/* Kolom Kanan: Informasi Bank */}
                    <div className="lg:col-span-3">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm h-full flex flex-col">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-3">
                                <i className="fas fa-university text-gray-400"></i>
                                <span>Informasi Rekening Pencairan</span>
                            </h2>
                            
                            {isBankDetailsComplete ? (
                                <div className="mt-6 space-y-5 flex-grow">
                                    <InfoItem icon="fa-landmark" label="Nama Bank" value={userProfile.bank_name} />
                                    <InfoItem icon="fa-user-check" label="Nama Pemilik Rekening" value={userProfile.account_name} />
                                    <InfoItem icon="fa-credit-card" label="Nomor Rekening" value={userProfile.account_number} />
                                    <div className="pt-5 mt-auto border-t border-gray-100">
                                        <Link href="/teknisi/profile" className="text-sm font-semibold text-blue-600 hover:underline">
                                            Ubah Informasi Bank di Profil →
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-6 text-center rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-8 flex flex-col items-center justify-center flex-grow">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                                        <i className="fas fa-exclamation-triangle text-2xl text-amber-500"></i>
                                    </div>
                                    <p className="mt-4 font-semibold text-amber-900">Informasi Rekening Belum Lengkap</p>
                                    <p className="mt-1 text-sm text-amber-800">Anda harus melengkapi informasi rekening bank sebelum dapat melakukan pencairan dana.</p>
                                    <Link 
                                        href="/teknisi/profile" 
                                        className="mt-6 inline-block rounded-lg bg-amber-500 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
                                    >
                                        Lengkapi Profil Sekarang
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </TechnicianAppLayout>
    );
}