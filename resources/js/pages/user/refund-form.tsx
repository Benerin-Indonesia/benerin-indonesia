import React, { PropsWithChildren, useState, useEffect } from "react";
import { Head, Link, usePage, useForm } from "@inertiajs/react";

// --- PALET WARNA & TIPE KONSISTEN ---
const PRIMARY = "#206BB0";
const SECONDARY = "#FFBD59";

// --- DEFINISI TIPE ---
type AuthUser = { id: number; name: string; email: string; };

type ServiceRequestData = {
    id: number;
    title: string;
    category: string;
    scheduled_for: string;
    bank_name: string;
    account_name: string;
    account_number: string;
};

// --- [MODIFIKASI] --- Tipe data Payment diperbarui ---
type PaymentData = {
    id: number; // <-- BARU
    amount: number;
    paid_at: string;
    provider: string;
    provider_ref: string;
    payload: any; // <-- BARU
};

type PageProps = {
    auth: { user: AuthUser };
    serviceRequest: ServiceRequestData;
    payment: PaymentData;
    errors: Partial<{ reason: string; account_name: string; account_number: string; bank_name: string; }>;
};

// --- FUNGSI HELPER ---
const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
const formatDate = (dateString: string) => new Date(dateString).toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: '2-digit', minute: '2-digit' });

// --- APP LAYOUT (Placeholder) ---
function AppLayout({ user, children }: PropsWithChildren<{ user: AuthUser | null }>) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
}


// --- KOMPONEN UTAMA ---
export default function RefundForm() {
    const { auth, serviceRequest, payment, errors } = usePage<PageProps>().props;

    // --- [MODIFIKASI UTAMA] --- Menambahkan data "rahasia" ke dalam state useForm ---
    const { data, setData, post, processing } = useForm({
        // Data yang diisi user
        reason: "",
        bank_name: serviceRequest.bank_name || "",
        account_name: serviceRequest.account_name || "",
        account_number: serviceRequest.account_number || "",

        // Data "rahasia" yang diambil dari props untuk dikirim ke backend
        payment_id: payment.id,
        amount: payment.amount,
        provider_ref: payment.provider_ref,
        payment_payload: payment.payload,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        // Inertia akan mengirim SEMUA data di atas ke route ini
        post(`/user/permintaan/refund`);
    };

    const inputClass = "block w-full rounded-lg border-gray-300 bg-white p-3 text-base text-gray-900 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50";

    return (
        <AppLayout user={auth.user}>
            <Head title="Formulir Pengajuan Refund" />

            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <header
                    className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg"
                    style={{ backgroundColor: PRIMARY }}
                >
                    <div className="absolute -right-10 -top-10 opacity-10"><i className="fas fa-hand-holding-usd text-[18rem] text-white transform -rotate-12"></i></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-4">
                            <Link href={`/user/permintaan/${serviceRequest.id}`} className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-white/10 transition hover:bg-white/20">
                                <i className="fas fa-arrow-left"></i>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Pengajuan Refund</h1>
                                <p className="mt-1 text-white/80">Untuk permintaan: "{serviceRequest.title}"</p>
                            </div>
                        </div>
                    </div>
                </header>

                <form onSubmit={submit} className="mt-8 space-y-8">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><i className="fas fa-receipt text-gray-400"></i><span>Ringkasan Transaksi</span></h2>
                        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm text-gray-500">Jumlah Refund</dt>
                                <dd className="text-2xl font-bold" style={{ color: PRIMARY }}>{formatRupiah(payment.amount)}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-gray-500">Tanggal Pembayaran</dt>
                                <dd className="font-semibold text-gray-800">{formatDate(payment.paid_at)}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-gray-500">Layanan</dt>
                                <dd className="font-semibold text-gray-800">{serviceRequest.title}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-gray-500">Jadwal</dt>
                                <dd className="font-semibold text-gray-800">{formatDate(serviceRequest.scheduled_for)}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <i className="fas fa-edit" style={{ color: PRIMARY }}></i>
                            <span>Detail Pengajuan</span>
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">Mohon isi data di bawah ini dengan lengkap dan benar untuk memproses pengembalian dana.</p>
                        <div className="mt-6 space-y-6">
                            <div>
                                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">Alasan Refund</label>
                                <textarea id="reason" value={data.reason} onChange={e => setData('reason', e.target.value)} rows={4} className={inputClass} placeholder="Contoh: Teknisi tidak datang sesuai jadwal..."></textarea>
                                {errors.reason && <p className="mt-1 text-xs text-red-600">{errors.reason}</p>}
                            </div>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="bank_name" className="block text-sm font-medium text-gray-700 mb-1">Nama Bank Tujuan</label>
                                    <input type="text" id="bank_name" value={data.bank_name} onChange={e => setData('bank_name', e.target.value)} className={inputClass} placeholder="Contoh: BCA, Mandiri" />
                                    {errors.bank_name && <p className="mt-1 text-xs text-red-600">{errors.bank_name}</p>}
                                </div>
                                <div>
                                    <label htmlFor="account_name" className="block text-sm font-medium text-gray-700 mb-1">Nama Pemilik Rekening</label>
                                    <input type="text" id="account_name" value={data.account_name} onChange={e => setData('account_name', e.target.value)} className={inputClass} placeholder="Contoh: Budi Santoso" />
                                    {errors.account_name && <p className="mt-1 text-xs text-red-600">{errors.account_name}</p>}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="account_number" className="block text-sm font-medium text-gray-700 mb-1">Nomor Rekening</label>
                                <input type="number" id="account_number" value={data.account_number} onChange={e => setData('account_number', e.target.value)} className={inputClass} placeholder="Masukkan nomor rekening tanpa spasi atau strip" />
                                {errors.account_number && <p className="mt-1 text-xs text-red-600">{errors.account_number}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={processing} className="inline-flex items-center justify-center rounded-xl bg-green-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-green-500/20 transition-all duration-300 ease-in-out hover:bg-green-700 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100">
                            {processing ? <><i className="fas fa-spinner fa-spin mr-2" /> Mengirim...</> : <><i className="fas fa-paper-plane mr-2" /> Kirim Pengajuan Refund</>}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}