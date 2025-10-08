import React, { useState, useEffect, PropsWithChildren } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';

// --- PALET WARNA ---
const PRIMARY = "#206BB0";
const SECONDARY = "#FFBD59";

// --- TIPE DATA ---
type AuthUser = { name: string; email: string };
type ServiceRequest = { id: number; title: string; };
type PaymentDetails = { order_id: string; amount: number; };
type PageProps = {
    auth: { user: AuthUser };
    snapToken: string;
    serviceRequest: ServiceRequest;
    payment: PaymentDetails;
    midtrans_client_key: string;
};

// --- TIPE BARU UNTUK NOTIFIKASI ---
type NotificationState = {
    show: boolean;
    status: 'success' | 'pending' | 'error' | '';
    title: string;
    message: string;
};

// --- HELPER & TIPE GLOBAL ---
function formatRupiah(angka: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency", currency: "IDR", minimumFractionDigits: 0,
    }).format(angka);
}
declare global { interface Window { snap: any; } }

// --- KOMPONEN LAYOUT APLIKASI ---
function AppLayout({ user, children }: PropsWithChildren<{ user: AuthUser | null }>) {
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const initial = user?.name.charAt(0).toUpperCase() ?? 'U';

    return (
        <div className="min-h-screen bg-gray-50/50">
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/80">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex-shrink-0">
                            <Link href="/" className="flex items-center gap-2 text-xl font-bold" style={{ color: PRIMARY }}>
                                <img
                                    src="/storage/assets/logo.png"
                                    alt="Benerin Indonesia"
                                    className="w-[150px] rounded object-contain"
                                />
                            </Link>
                        </div>
                        <nav className="hidden md:flex md:items-center md:gap-x-8">
                            <Link href="/user/home" className="flex items-center gap-2 text-sm font-semibold transition" style={{ color: PRIMARY }}>
                                <i className="fas fa-home" /> Beranda
                            </Link>
                            <Link href="/user/permintaan" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition">
                                <i className="fas fa-clipboard-list" /> Permintaan
                            </Link>
                        </nav>
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
                                    <div className="px-4 py-2 border-b">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                    </div>
                                    <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                                        <i className="fas fa-user-edit w-6 mr-1"></i> Profil Saya
                                    </Link>
                                    <Link href="/logout" method="post" as="button" className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                        <i className="fas fa-sign-out-alt w-6 mr-1"></i> Keluar
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            <main>{children}</main>
            <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-t-lg z-30">
                <nav className="grid grid-cols-3 h-16">
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
            <div className="h-16 md:hidden"></div>
        </div>
    );
}

// --- KOMPONEN UTAMA HALAMAN PEMBAYARAN ---
export default function ShowPayment() {
    const { props } = usePage<PageProps>();
    const { auth, snapToken, serviceRequest, payment, midtrans_client_key } = props;

    const [isPaying, setIsPaying] = useState(false);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);

    // State baru untuk mengontrol notifikasi modal
    const [notification, setNotification] = useState<NotificationState>({
        show: false,
        status: '',
        title: '',
        message: '',
    });

    useEffect(() => {
        // const snapScriptUrl = 'https://app.sandbox.midtrans.com/snap/snap.js'; //dev
        const snapScriptUrl = 'https://app.midtrans.com/snap/snap.js'; // prod
        const script = document.createElement('script');
        script.src = snapScriptUrl;
        script.setAttribute('data-client-key', midtrans_client_key);
        script.async = true;
        script.onload = () => setIsScriptLoaded(true);
        document.body.appendChild(script);
        return () => {
            const existingScript = document.querySelector(`script[src="${snapScriptUrl}"]`);
            if (existingScript) document.body.removeChild(existingScript);
        };
    }, [midtrans_client_key]);

    // Kalau Dev
    const handlePay = () => {
        if (!window.snap || !isScriptLoaded) {
            alert("Layanan pembayaran belum siap, mohon tunggu sesaat.");
            return;
        }
        setIsPaying(true);

        window.snap.pay(snapToken, {
            onSuccess: (result) => {
                router.post('/user/payment/success', {
                    service_request_id: serviceRequest.id,
                    midtrans_response: result, // Mengirim seluruh detail dari Midtrans
                });
            },
            onPending: (result) => {
                // Arahkan ke route 'payment.pending' dengan data yang relevan
                router.post('/user/payment/pending', {
                    service_request_id: serviceRequest.id,
                    midtrans_response: result,
                });
            },
            onError: (result) => {
                // Arahkan ke route 'payment.fail' dengan data yang relevan
                router.post('/user/payment/fail', {
                    service_request_id: serviceRequest.id,
                    midtrans_response: result,
                }, {
                    // Opsi tambahan untuk Inertia
                    onFinish: () => setIsPaying(false), // Matikan status 'isPaying' setelah request selesai
                });
            },
            onClose: () => {
                // Tetap hentikan status 'isPaying' jika pengguna menutup pop-up
                setIsPaying(false);
            }
        });
    };

    // const handlePay = () => {
    //     if (!window.snap || !isScriptLoaded) {
    //         alert("Layanan pembayaran belum siap, mohon tunggu sesaat.");
    //         return;
    //     }
    //     setIsPaying(true);

    //     window.snap.pay(snapToken, {
    //         onSuccess: (result) => {
    //             setNotification({
    //                 show: true,
    //                 status: 'success',
    //                 title: 'Pembayaran Berhasil!',
    //                 message: 'Pembayaran Anda telah kami terima. Anda akan segera diarahkan ke halaman detail permintaan.',
    //             });
    //         },
    //         onPending: (result) => {
    //             setNotification({
    //                 show: true,
    //                 status: 'pending',
    //                 title: 'Menunggu Pembayaran',
    //                 message: 'Silakan selesaikan pembayaran Anda melalui metode yang telah dipilih. Halaman ini akan diarahkan secara otomatis.',
    //             });
    //         },
    //         onError: (result) => {
    //             setNotification({
    //                 show: true,
    //                 status: 'error',
    //                 title: 'Pembayaran Gagal',
    //                 message: 'Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi atau pilih metode pembayaran lain.',
    //             });
    //             setIsPaying(false);
    //         },
    //         onClose: () => {
    //             setIsPaying(false);
    //         }
    //     });
    // };
    // Fungsi untuk menutup modal dan mengarahkan pengguna 
    // const closeNotificationAndRedirect = () => {
    //     setNotification({ ...notification, show: false });
    //     if (notification.status === 'success' || notification.status === 'pending') {
    //         router.visit(`/user/permintaan/${serviceRequest.id}`);
    //     }
    // };
    // --- KOMPONEN BARU: NOTIFICATION MODAL ---
    // function NotificationModal({
    //     show,
    //     status,
    //     title,
    //     message,
    //     onClose,
    // }: NotificationState & { onClose: () => void }) {
    //     if (!show) return null;

    //     const theme = {
    //         success: {
    //             bg: 'bg-green-50',
    //             iconBg: 'bg-green-100',
    //             iconColor: 'text-green-600',
    //             iconClass: 'fas fa-check-circle',
    //         },
    //         pending: {
    //             bg: 'bg-amber-50',
    //             iconBg: 'bg-amber-100',
    //             iconColor: 'text-amber-600',
    //             iconClass: 'fas fa-hourglass-half',
    //         },
    //         error: {
    //             bg: 'bg-red-50',
    //             iconBg: 'bg-red-100',
    //             iconColor: 'text-red-600',
    //             iconClass: 'fas fa-times-circle',
    //         },
    //     };
    //     const currentTheme = theme[status] || theme.success;
    //     return (
    //         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
    //             <div
    //                 onClick={(e) => e.stopPropagation()}
    //                 className={`reveal rounded-2xl shadow-lg w-full max-w-md m-4 overflow-hidden border ${currentTheme.bg}`}
    //             >
    //                 <div className={`p-5 flex items-start gap-4`}>
    //                     <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${currentTheme.iconBg}`}>
    //                         <i className={`${currentTheme.iconClass} text-2xl ${currentTheme.iconColor}`}></i>
    //                     </div>
    //                     <div className="flex-1">
    //                         <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    //                         <p className="mt-1 text-sm text-gray-600">{message}</p>
    //                         <button
    //                             onClick={onClose}
    //                             className="mt-4 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition"
    //                             style={{ backgroundColor: PRIMARY }}
    //                         >
    //                             Mengerti
    //                         </button>
    //                     </div>
    //                 </div>
    //             </div>
    //         </div>
    //     );
    // }

    return (
        <AppLayout user={auth.user}>
            <Head title="Selesaikan Pembayaran" />

            {/* <NotificationModal {...notification} onClose={closeNotificationAndRedirect} /> */}

            <style>{`.reveal { transition: all .6s cubic-bezier(.22,.8,.28,1); } .reveal-prepare { opacity: 0; transform: translateY(20px); } .reveal-prepare.show { opacity: 1; transform: none; }`}</style>

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

                    <div className="flex flex-col gap-8 lg:col-span-2">
                        <section className="reveal">
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                                Selesaikan Pembayaran Anda
                            </h1>
                            <p className="mt-1 text-lg text-gray-600">
                                Satu langkah lagi untuk mengonfirmasi jadwal servis Anda.
                            </p>
                        </section>

                        <section className="reveal rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900">Rincian Tagihan</h2>
                            <dl className="mt-4 divide-y divide-gray-200/80 border-y border-gray-200/80">
                                <div className="flex justify-between py-4 text-sm">
                                    <dt className="text-gray-600">Layanan</dt>
                                    <dd className="font-medium text-gray-900 text-right">{serviceRequest.title}</dd>
                                </div>
                                <div className="flex justify-between py-4 text-sm">
                                    <dt className="text-gray-600">ID Pesanan</dt>
                                    <dd className="font-mono text-gray-700">{payment.order_id}</dd>
                                </div>
                                <div className="flex justify-between py-4 text-base font-semibold">
                                    <dt className="text-gray-900">Total Pembayaran</dt>
                                    <dd style={{ color: PRIMARY }}>{formatRupiah(payment.amount)}</dd>
                                </div>
                            </dl>
                            <div className="mt-6">
                                <button
                                    onClick={handlePay}
                                    disabled={!isScriptLoaded || isPaying}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-gray-400 disabled:scale-100"
                                    style={{ backgroundColor: PRIMARY }}
                                >
                                    <i className="fas fa-shield-alt" />
                                    <span>
                                        {!isScriptLoaded ? 'Memuat Opsi Bayar...' : (isPaying ? 'Memproses...' : 'Lanjutkan ke Pembayaran')}
                                    </span>
                                </button>
                            </div>
                        </section>
                    </div>

                    <aside className="flex flex-col gap-8 lg:col-span-1">
                        <section className="reveal">
                            <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-green-100">
                                        <i className="fas fa-lock text-xl text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Transaksi Aman</h3>
                                        <p className="text-sm text-gray-600">Pembayaran diproses oleh Midtrans, gerbang pembayaran terpercaya di Indonesia.</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                        <section className="reveal">
                            <div className="rounded-2xl p-6 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${PRIMARY}, #1a5a96)` }}>
                                <h3 className="text-lg font-bold">Butuh Bantuan?</h3>
                                <p className="mt-1 text-sm opacity-90">Tim support kami siap membantu jika Anda mengalami kendala.</p>
                                <Link href="/bantuan" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold transition hover:scale-[1.03]" style={{ color: PRIMARY }}>
                                    <i className="fas fa-life-ring" /> Pusat Bantuan
                                </Link>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
}