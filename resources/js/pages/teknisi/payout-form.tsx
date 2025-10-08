import React, { PropsWithChildren, useState, useEffect } from "react";
import { Head, Link, usePage, useForm } from "@inertiajs/react";

// --- PALET WARNA & TIPE KONSISTEN ---
const PRIMARY = "#206BB0";
const SECONDARY = "#FFBD59";

// --- DEFINISI TIPE ---
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
    errors: Partial<{ amount: string; bank: string }>;
    status?: string;
};

// --- FUNGSI HELPER ---
const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);

// --- APP LAYOUT (KONSISTEN) ---
function TechnicianAppLayout({ user, children }: PropsWithChildren<{ user: AuthUser | null }>) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
}

// --- KOMPONEN UTAMA ---
export default function CreatePayout() {
    const { auth, totalBalance, userProfile, errors, status } = usePage<PageProps>().props;
    
    // --- [MODIFIKASI] --- Form sekarang otomatis diisi dengan totalBalance ---
    const { data, setData, post, processing, wasSuccessful } = useForm({
        amount: String(totalBalance), // Langsung set jumlah penarikan 100%
    });

    const isBankDetailsComplete = !!(userProfile.bank_name && userProfile.account_name && userProfile.account_number);
    
    // Minimal penarikan, contoh: Rp 10.000
    const MINIMUM_PAYOUT = 10000;
    const canSubmit = isBankDetailsComplete && totalBalance >= MINIMUM_PAYOUT;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        // setData di-call lagi di sini untuk memastikan nilai 'amount' terbaru yang dikirim
        setData('amount', String(totalBalance)); 
        post('/teknisi/withdraw');
    };

    return (
        <TechnicianAppLayout user={auth.user}>
            <Head title="Pencairan Dana" />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <header 
                    className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg"
                    style={{ backgroundColor: PRIMARY }}
                >
                    <div className="absolute -right-10 -top-10 opacity-10"><i className="fas fa-money-bill-wave text-[18rem] text-white transform -rotate-12"></i></div>
                    <div className="relative z-10">
                        {/* --- [BARU] --- Tombol Kembali --- */}
                        <button 
                            onClick={() => window.history.back()} 
                            className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/80 transition hover:text-white"
                        >
                            <i className="fas fa-arrow-left fa-xs" />
                            <span>Kembali ke Wallet</span>
                        </button>
                        <h1 className="text-3xl font-bold tracking-tight">Konfirmasi Pencairan Dana</h1>
                        <p className="mt-1 text-white/80">Anda akan menarik seluruh saldo yang tersedia ke rekening bank Anda.</p>
                    </div>
                </header>

                {/* Notifikasi Sukses/Error */}
                {status === 'payout_requested' && (
                    <div className="my-6 rounded-lg bg-green-100 p-4 text-sm font-medium text-green-800">
                        Pengajuan pencairan dana Anda telah berhasil dikirim dan akan segera diproses.
                    </div>
                )}
                {errors.bank && (
                    <div className="my-6 rounded-lg bg-red-100 p-4 text-sm font-medium text-red-800">
                        {errors.bank}
                    </div>
                )}


                <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* --- [MODIFIKASI] --- Kolom utama sekarang menampilkan konfirmasi, bukan form input --- */}
                    <div className="lg:col-span-2">
                        <form onSubmit={submit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900">Detail Konfirmasi</h2>
                            
                            <div className="mt-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Total Saldo yang Akan Dicairkan</label>
                                    <p className="text-4xl font-bold" style={{color: PRIMARY}}>{formatRupiah(totalBalance)}</p>
                                    {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount}</p>}
                                </div>

                                <div className="text-sm text-gray-600 border-t pt-6">
                                    <p>Dengan menekan tombol di bawah, Anda mengonfirmasi untuk menarik seluruh saldo di atas ke rekening bank terdaftar Anda. Proses ini akan ditinjau oleh administrator.</p>
                                </div>

                                {/* Tombol Submit */}
                                <div className="pt-2">
                                    <button type="submit" disabled={processing || !canSubmit} className="w-full inline-flex items-center justify-center rounded-xl bg-green-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-green-500/20 transition-all duration-300 ease-in-out hover:bg-green-700 hover:scale-105 disabled:opacity-50 disabled:bg-gray-400 disabled:hover:scale-100">
                                        {processing ? <><i className="fas fa-spinner fa-spin mr-2" /> Memproses...</> : 'Ya, Konfirmasi & Cairkan Semua Saldo'}
                                    </button>
                                    {!canSubmit && totalBalance < MINIMUM_PAYOUT && (
                                        <p className="mt-2 text-center text-xs text-red-600">Saldo Anda kurang dari minimum penarikan ({formatRupiah(MINIMUM_PAYOUT)}).</p>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Kolom Kanan: Info Bank */}
                    <div className="lg:col-span-1">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm h-full">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><i className="fas fa-university text-gray-400"></i><span>Rekening Tujuan</span></h2>
                            {isBankDetailsComplete ? (
                                <div className="mt-4 space-y-4">
                                    <div><dt className="text-sm text-gray-500">Nama Bank</dt><dd className="font-semibold text-gray-800">{userProfile.bank_name}</dd></div>
                                    <div><dt className="text-sm text-gray-500">Nama Pemilik</dt><dd className="font-semibold text-gray-800">{userProfile.account_name}</dd></div>
                                    <div><dt className="text-sm text-gray-500">Nomor Rekening</dt><dd className="font-semibold text-gray-800 tracking-wider">{userProfile.account_number}</dd></div>
                                    <div className="pt-4 border-t"><Link href="/teknisi/profile" className="text-sm font-semibold text-blue-600 hover:underline">Ubah Rekening →</Link></div>
                                </div>
                            ) : (
                                <div className="mt-6 text-center rounded-xl border-2 border-dashed border-red-300 bg-red-50/50 p-6">
                                    <i className="fas fa-exclamation-triangle text-2xl text-red-500"></i>
                                    <p className="mt-3 font-semibold text-red-900">Rekening Belum Diatur</p>
                                    <p className="mt-1 text-sm text-red-800">Harap lengkapi info bank di profil Anda.</p>
                                    <Link href="/teknisi/profile" className="mt-4 inline-block rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700">Lengkapi Profil</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </TechnicianAppLayout>
    );
}