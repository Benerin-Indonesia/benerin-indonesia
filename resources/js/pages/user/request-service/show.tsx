import React, { useState, useEffect, PropsWithChildren, useRef } from "react";
import { Head, Link, usePage, useForm, router } from "@inertiajs/react";
import axios from 'axios';

// --- PALET WARNA & TIPE KONSISTEN ---
const PRIMARY = "#206BB0";
const SECONDARY = "#FFBD59";

// --- TIPE DATA ---
type AuthUser = { id: number; name: string; email: string; };
type RequestStatus = "menunggu" | "diproses" | "dijadwalkan" | "selesai" | "dibatalkan";
const STATUS_STEPS: RequestStatus[] = ["menunggu", "diproses", "dijadwalkan", "selesai"];

type ServiceRequest = {
    id: number;
    title: string;
    status: RequestStatus;
    accepted_price: number | null;
    category: string;
    scheduled_for: string | null;
    description: string;
};

// Tipe untuk semua props yang diterima dari Inertia
type PageProps = {
    auth: { user: AuthUser };
    request: ServiceRequest;
    paymentStatus: "pending" | "settled" | "failure" | "refunded" | "cancelled" | false;
    needsPaymentAction: boolean;
    initialMessages: ChatMessage[];
    requestPhotoPath: string;
};

type ChatMessage = {
    id: number;
    sender_id: number; // Sesuai migrasi
    body: string;      // Sesuai migrasi
    sender: {          // Relasi 'sender'
        id: number;
        name: string;
    };
    created_at: string;
};

// --- FUNGSI HELPER ---
function formatRupiah(angka: number | string | null) {
    if (angka === null || angka === undefined) return "N/A";
    const number = parseFloat(angka as string);
    if (isNaN(number)) return "N/A";
    return new Intl.NumberFormat("id-ID", {
        style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(number);
}

function formatDate(dateString: string | null) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
        day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
}

// --- NEW COMPONENT: Application Layout with Responsive Navbar ---
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
                    <Link href="/user/home" className="flex flex-col items-center justify-center gap-1 text-xs font-medium">
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

// --- KOMPONEN: StatusTimeline ---
function StatusTimeline({ currentStatus }: { currentStatus: RequestStatus }) {
    const stepLabels = {
        menunggu: "Permintaan Dibuat",
        diproses: "Penawaran Diberikan",
        dijadwalkan: "Layanan Dijadwalkan",
        selesai: "Selesai",
        dibatalkan: "Dibatalkan",
    };

    const currentIndex = STATUS_STEPS.indexOf(currentStatus);

    return (
        <div className="flex items-start justify-between px-2 pt-2">
            {STATUS_STEPS.map((step, index) => {
                const isCompleted = index < currentIndex;
                const isActive = index === currentIndex;

                return (
                    <div key={step} className="relative flex flex-1 flex-col items-center text-center">
                        {index > 0 && (
                            <div
                                className="absolute top-3.5 right-1/2 z-0 h-0.5 w-full"
                                style={{
                                    backgroundColor: isCompleted || isActive ? PRIMARY : '#e5e7eb', // gray-200
                                }}
                            ></div>
                        )}
                        <div
                            className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full"
                            style={{
                                backgroundColor: isCompleted || isActive ? PRIMARY : '#f3f4f6', // gray-100
                                border: isActive ? `3px solid ${SECONDARY}` : `3px solid ${isCompleted ? PRIMARY : '#f3f4f6'}`,
                                boxShadow: isActive ? `0 0 10px ${SECONDARY}90` : 'none',
                            }}
                        >
                            {isCompleted ? <i className="fas fa-check text-xs text-white"></i> : <div className="h-2 w-2 rounded-full bg-white"></div>}
                        </div>
                        <p className={`mt-2 text-xs font-semibold ${isCompleted || isActive ? 'text-gray-800' : 'text-gray-400'}`}>
                            {stepLabels[step]}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}

// --- KOMPONEN UTAMA: Show ---
export default function Show() {
    const { props } = usePage<PageProps>();
    const { auth, request, paymentStatus, needsPaymentAction, initialMessages, requestPhotoPath } = props;
    const [shouldScroll, setShouldScroll] = useState(false);

    const [actionType, setActionType] = useState<"accept" | "reject" | null>(null);
    const [showConfirmEndServiceModal, setShowConfirmEndServiceModal] = useState(false); // <-- State baru untuk modal
    const [isModalOpen, setIsModalOpen] = useState(false); // state open popup foto

    // --- STATE & LOGIKA CHAT ---
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [newMessage, setNewMessage] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    // use effect new chat
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ["initialMessages"],
                onSuccess: (page) => {
                    const newMessages = (page.props as any).initialMessages;

                    // Jika jumlah pesan bertambah → scroll ke bawah
                    if (newMessages.length > messages.length) {
                        setShouldScroll(true);
                    }

                    setMessages(newMessages);
                },
            });
        }, 2000);

        return () => clearInterval(interval);
    }, [messages]); // <--- penting: tambahkan dependency messages


    // Form Inertia untuk berbagai aksi
    const { post, processing } = useForm({
        id: request.id,
    });
    // Handler untuk form pembayaran
    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        post('/user/payment');
    };

    // Handler untuk menyelesaikan servis
    const handleEndService = () => {
        post(`/user/permintaan/${request.id}/end`, {
            onSuccess: () => setShowConfirmEndServiceModal(false), // Tutup modal setelah sukses
        });
    };

    // Handler untuk refund
    const handleRefund = (e: React.MouseEvent) => {
        e.preventDefault();
        router.get(`/user/permintaan/${request.id}/refund`);
    };

    // Use effect ketika ada pesan baru container kebawah
    useEffect(() => {
        if (chatContainerRef.current) {
            const container = chatContainerRef.current;
            container.scrollTop = container.scrollHeight;
        }
    }, []);

    useEffect(() => {
        if (chatContainerRef.current && shouldScroll) {
            const container = chatContainerRef.current;
            container.scrollTop = container.scrollHeight;
            setShouldScroll(false);
        }
    }, [messages, shouldScroll]);

    const handleConfirm = () => {
        if (!actionType) return;
        const url = actionType === "accept"
            ? `/user/permintaan/${request.id}/accept-price`
            : `/user/permintaan/${request.id}/reject-price`;
        post(url, { preserveScroll: true, onSuccess: () => setActionType(null) });
    };

    useEffect(() => {
        if (typeof window === "undefined" || typeof document === "undefined") return;
        const elements = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
        const prepare = (el: HTMLElement) => el.classList.add("reveal-prepare");
        const show = (el: HTMLElement) => el.classList.add("show");
        elements.forEach(prepare);
        if ("IntersectionObserver" in window) {
            const obs = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        show(entry.target as HTMLElement);
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            elements.forEach((el) => obs.observe(el));
            return () => obs.disconnect();
        } else {
            elements.forEach(show);
        }
    }, []);

    const getEffectiveStatus = (): RequestStatus => {
        if (request.status === 'menunggu' && request.accepted_price && needsPaymentAction) {
            return 'diproses';
        }

        if (request.status === 'dijadwalkan' && request.accepted_price && needsPaymentAction) {
            return 'diproses';
        }

        return request.status;
    };

    const effectiveStatus = getEffectiveStatus();

    // Fitur Chat
    const [isSending, setIsSending] = useState(false); // Tambahkan state untuk loading
    const handleSendChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        const messageToSend = newMessage;

        const optimisticMessage: ChatMessage = {
            id: crypto.randomUUID() as any,
            sender_id: auth.user.id,
            body: messageToSend,
            sender: auth.user,
            created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage("");
        setIsSending(true);
        setShouldScroll(true); // 🟢 aktifkan scroll hanya ketika user kirim pesan

        try {
            await axios.post(`/user/chat/request/${request.id}`, {
                body: messageToSend,
            });
        } catch (error) {
            console.error("Gagal mengirim pesan:", error);
            setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
            setNewMessage(messageToSend);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <AppLayout user={auth.user}>
            <Head title={`Detail Permintaan #${request.id}`} />

            <style>{`:root { --primary: ${PRIMARY}; --secondary: ${SECONDARY}; --ease: cubic-bezier(.22,.8,.28,1); } .reveal { transition: all .6s var(--ease); } .reveal-prepare { opacity: 0; transform: translateY(20px); } .reveal-prepare.show { opacity: 1; transform: none; } @media (prefers-reduced-motion: reduce) { .reveal, .reveal-prepare, .reveal-prepare.show { transition: none !important; transform: none !important; opacity: 1 !important; } }`}</style>
            <noscript><style>{`.reveal { opacity: 1 !important; transform: none !important; }`}</style></noscript>

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

                <div className="reveal rounded-2xl p-6 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${PRIMARY}, #1a5a96)` }}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold opacity-80">Permintaan #{request.id}</p>
                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                {request.title}
                            </h1>
                        </div>
                        <Link
                            // href="/user/home"
                            as="button"
                            onClick={() => window.history.back()}
                            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                        >
                            <i className="fas fa-arrow-left fa-xs" /> Kembali
                        </Link>
                    </div>
                </div>

                <div className="reveal mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="flex flex-col gap-6 lg:col-span-2">

                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="text-base font-semibold text-gray-900">Perjalanan Servis Anda</h2>
                            <StatusTimeline currentStatus={effectiveStatus} />
                        </div>

                        {/* --- KONDISI 1: Menunggu Teknisi Memberi Penawaran --- */}
                        {request.status === "menunggu" && !request.accepted_price && (
                            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                                <div className="grid h-12 w-12 mx-auto place-items-center rounded-full bg-gray-100">
                                    <i className="fas fa-hourglass-half text-2xl text-gray-500"></i>
                                </div>
                                <h2 className="mt-4 text-lg font-semibold text-gray-900">Menunggu Penawaran</h2>
                                <p className="mt-1 text-sm text-gray-600">Teknisi kami sedang meninjau permintaan Anda dan akan segera memberikan penawaran harga terbaik.</p>
                            </div>
                        )}

                        {/* --- KONDISI 2: Teknisi Sudah Memberi Penawaran, Menunggu Persetujuan Anda --- */}
                        {request.status === "menunggu" && request.accepted_price && (
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-100 p-6 shadow-lg shadow-blue-500/10 sm:p-8">
                                {/* Decorative background element */}
                                <i className="fas fa-star absolute -right-8 -top-8 text-9xl text-white/50 opacity-80"></i>

                                <div className="relative z-10 flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-between">
                                    {/* --- Informasi Penawaran --- */}
                                    <div className="flex flex-col items-center text-center md:items-start md:text-left">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-md">
                                            <i className="fas fa-gift text-xl"></i>
                                        </div>
                                        <h2 className="mt-4 text-xl font-bold text-slate-800">Penawaran Spesial Untuk Anda!</h2>
                                        <p className="mt-1 max-w-md text-sm text-slate-600">Satu langkah lagi untuk memulai pekerjaan. Silakan tinjau penawaran harga di bawah ini.</p>
                                        <div className="mt-5">
                                            <p className="text-sm font-medium text-slate-500">Hanya</p>
                                            <p className="text-4xl font-bold tracking-tight text-[#206BB0] sm:text-5xl">{formatRupiah(request.accepted_price)}</p>
                                        </div>
                                    </div>

                                    {/* --- Tombol Aksi --- */}
                                    <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto md:mt-4">
                                        <button
                                            onClick={() => setActionType("accept")}
                                            className="cursor-pointer group inline-flex w-full items-center justify-center gap-3 rounded-xl bg-green-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-green-500/20 transition-all duration-300 ease-in-out hover:bg-green-600 hover:shadow-xl hover:-translate-y-1"
                                        >
                                            <i className="fas fa-check-circle transition-transform duration-300 group-hover:rotate-12"></i>
                                            <span>Ya, Saya Terima</span>
                                        </button>
                                        <button
                                            onClick={() => setActionType("reject")}
                                            className="cursor-pointer w-full rounded-xl px-6 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-red-500/10 hover:text-red-700"
                                        >
                                            Tolak Penawaran
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- KONDISI 3 (PERBAIKAN): Penawaran Diterima, Menunggu Pembayaran --- */}
                        {request.status === "dijadwalkan" && request.accepted_price && needsPaymentAction && (
                            <form
                                onSubmit={handlePayment}
                                className="rounded-2xl border border-blue-200 p-6 shadow-sm"
                                style={{ background: 'linear-gradient(135deg, #e0f7fa 0%, #e8f5e9 100%)' }}
                            >
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <div className="grid h-12 w-12 place-items-center rounded-full bg-white shadow-md">
                                        <i className="fas fa-credit-card text-2xl" style={{ color: PRIMARY }}></i>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">Menunggu Pembayaran</h2>
                                        <p className="mt-1 text-sm text-gray-600">Lakukan pembayaran sebesar <span className="font-bold">{formatRupiah(request.accepted_price)}</span> untuk mengonfirmasi jadwal servis Anda.</p>
                                        <p className="text-xs text-gray-500 mt-2">Status Pembayaran: {paymentStatus === false ? 'Belum Diproses' : paymentStatus}</p>
                                    </div>
                                    <div className="mt-2">
                                        <button
                                            type="submit"
                                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
                                            style={{ backgroundColor: PRIMARY, minWidth: '220px' }}
                                        >
                                            Lakukan Pembayaran Sekarang
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* --- KONDISI 4 (PERBAIKAN STYLE): Pembayaran Lunas, Menunggu Layanan Selesai --- */}
                        {request.status === "dijadwalkan" && !needsPaymentAction && (
                            <div
                                className="rounded-2xl p-6 text-center shadow-lg text-white"
                                style={{ background: `linear-gradient(145deg, ${PRIMARY}, #1a5a96)` }}
                            >
                                <div
                                    className="grid h-14 w-14 mx-auto place-items-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30"
                                >
                                    <i
                                        className="fas fa-calendar-check text-3xl"
                                        style={{
                                            color: SECONDARY,
                                            textShadow: `0 0 15px ${SECONDARY}80` // Efek bersinar
                                        }}
                                    ></i>
                                </div>

                                <h2 className="mt-4 text-xl font-bold text-white">Pembayaran Berhasil & Terkonfirmasi</h2>
                                <p className="mt-1 max-w-md mx-auto text-sm text-white/80">
                                    Jadwal servis Anda telah dikonfirmasi. Teknisi akan segera datang sesuai dengan jadwal yang telah ditentukan.
                                </p>

                                {/* Tombol Aksi Tambahan */}
                                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <button
                                        onClick={() => setShowConfirmEndServiceModal(true)}
                                        className="w-full sm:w-auto cursor-pointer rounded-xl px-6 py-3 text-sm font-semibold shadow-lg transition hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-800"
                                        style={{
                                            backgroundColor: SECONDARY,
                                            color: '#4a3f28' // Warna teks gelap agar kontras di atas kuning
                                        }}
                                    >
                                        <i className="fas fa-check mr-2"></i>
                                        Selesaikan Servis
                                    </button>
                                    <Link
                                        href={`/user/permintaan/${request.id}/refund`}
                                        method="post"
                                        as="button"
                                        onClick={handleRefund}
                                        className="w-full sm:w-auto text-xs text-white/60 hover:text-white hover:underline transition"
                                    >
                                        Ajukan Refund
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* --- KONDISI 5 (PERBAIKAN STYLE): Service request Selesai --- */}
                        {request.status === "selesai" && request.accepted_price && (
                            <div className="rounded-2xl p-6 text-center shadow-lg" style={{ background: `linear-gradient(135deg, #10B981, #059669)` }}>
                                <div className="grid h-14 w-14 mx-auto place-items-center rounded-full bg-white/30 backdrop-blur-sm">
                                    <i className="fas fa-star text-3xl text-white"></i>
                                </div>
                                <h2 className="mt-4 text-xl font-bold text-white">Layanan Telah Selesai!</h2>
                                <p className="mt-1 text-sm text-white/90">Terima kasih telah menggunakan layanan kami. Semoga masalah Anda teratasi dengan baik.</p>
                                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <Link
                                        href="/user/home"
                                        className="w-full sm:w-auto text-xs text-white/80 hover:text-white hover:underline underline transition"
                                    >
                                        Kembali ke Daftar Permintaan
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* --- KONDISI 6 (PERBAIKAN STYLE): Service request gagal dan di batalkan --- */}
                        {request.status === "dibatalkan" && (
                            <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-100 p-6 text-center shadow-sm">
                                <div className="grid h-12 w-12 mx-auto place-items-center rounded-full bg-gray-200">
                                    <i className="fas fa-ban text-2xl text-gray-500"></i>
                                </div>
                                <h2 className="mt-4 text-lg font-semibold text-gray-800">Permintaan Dibatalkan</h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    Permintaan servis ini telah dibatalkan dan tidak akan dilanjutkan.
                                </p>
                                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <Link
                                        href="/user/permintaan/buat" // Arahkan ke halaman buat permintaan baru
                                        className="w-full sm:w-auto cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-800 bg-white border border-gray-300 shadow-sm transition hover:bg-gray-50"
                                    >
                                        <i className="fas fa-plus mr-2"></i>
                                        Buat Permintaan Baru
                                    </Link>
                                    <Link
                                        href="/user/home"
                                        className="w-full sm:w-auto text-xs text-gray-500 hover:text-gray-800 hover:underline transition"
                                    >
                                        Kembali ke Daftar
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Meta data service*/}
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="text-base font-semibold text-gray-900">Rincian Permintaan</h2>
                            <dl className="mt-4 divide-y divide-gray-100">
                                <div className="py-4 grid grid-cols-1 sm:grid-cols-3 sm:gap-4">
                                    <dt className="text-sm text-gray-500">Kategori</dt>
                                    <dd className="mt-1 text-sm font-medium text-gray-800 sm:col-span-2 sm:mt-0">
                                        {request.category}
                                    </dd>
                                </div>
                                <div className="py-4 grid grid-cols-1 sm:grid-cols-3 sm:gap-4">
                                    <dt className="text-sm text-gray-500">Jadwal Diinginkan</dt>
                                    <dd className="mt-1 text-sm font-medium text-gray-800 sm:col-span-2 sm:mt-0">
                                        {formatDate(request.scheduled_for)}
                                    </dd>
                                </div>
                                <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 sm:gap-4">
                                    <dt className="text-sm text-gray-500">Deskripsi Masalah</dt>
                                    <dd className="mt-1 text-sm font-medium text-gray-800 sm:col-span-2 sm:mt-0 whitespace-pre-wrap">
                                        {request.description}
                                    </dd>
                                </div>
                            </dl>

                            {/* === FOTO PERMINTAAN === */}
                            <div className="mt-6">
                                <h3 className="text-sm font-semibold text-gray-900">Foto Permintaan</h3>

                                {/* Cek dan tampilkan thumbnail gambar */}
                                {requestPhotoPath ? (
                                    <div className="mt-3">
                                        <div
                                            // Tambahkan onClick untuk membuka modal
                                            onClick={() => setIsModalOpen(true)}
                                            className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-gray-50 transition hover:shadow-md"
                                        >
                                            <img
                                                src={`/storage/${requestPhotoPath}`}
                                                alt="Foto Permintaan"
                                                className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                onError={(e) => {
                                                    (e.currentTarget as HTMLImageElement).src =
                                                        "https://via.placeholder.com/150/eeeeee/777777?text=Gagal+Muat";
                                                }}
                                            />
                                            {/* Ikon untuk memperjelas bisa di-klik */}
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
                                                <i className="fas fa-expand text-2xl text-white"></i>
                                            </div>
                                        </div>
                                        <p className="mt-3 text-sm text-gray-500 italic">
                                            Tap gambar untuk zoom
                                        </p>
                                    </div>
                                ) : (
                                    <p className="mt-3 text-sm text-gray-500 italic">
                                        Tidak ada foto yang diunggah untuk permintaan ini.
                                    </p>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Section chat */}
                    <div id="section-chat-user" className="lg:col-span-1 rounded-2xl border border-gray-200 bg-white shadow-sm flex flex-col overflow-hidden h-[73vh] md:h-[60vh]">
                        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                            <img src={`https://ui-avatars.com/api/?name=Teknisi&background=random`} alt={'Teknisi'} className="h-10 w-10 rounded-full" />
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900">Diskusi dengan Teknisi</h2>
                            </div>
                        </div>

                        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex items-end gap-2 ${msg.sender.id === auth.user.id ? "justify-end" : "justify-start"}`}>
                                    <div
                                        // KONTEN PESAN DIAMBIL DARI 'msg.body'
                                        className={`max-w-[80%] rounded-t-xl px-3 py-2 text-sm ${msg.sender.id === auth.user.id ? "rounded-l-xl text-white" : "rounded-r-xl bg-gray-100 border text-gray-800"}`}
                                        style={msg.sender.id === auth.user.id ? { backgroundColor: PRIMARY } : {}}
                                    >
                                        {msg.body}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleSendChat} className="p-3 border-t border-gray-200 bg-white flex items-center gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="flex-1 rounded-lg border bg-gray-50 px-3 py-2 text-sm focus:border-transparent focus:ring-2 w-full"
                                placeholder="Tulis balasan..."
                                style={{ '--tw-ring-color': SECONDARY } as React.CSSProperties}
                                disabled={isSending} // Nonaktifkan input saat mengirim
                            />
                            <button type="submit" className="cursor-pointer flex-shrink-0 grid h-9 w-9 place-items-center rounded-lg text-white shadow-sm transition" style={{ backgroundColor: PRIMARY }} disabled={isSending}>
                                {/* Tambahkan ikon loading */}
                                {isSending ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane fa-sm"></i>}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Modal Penawaran */}
            {actionType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-lg" onClick={() => setActionType(null)}>
                    <div className="bg-white rounded-2xl shadow-lg w-full max-w-md m-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className={`p-5 flex items-center gap-4 ${actionType === 'accept' ? 'bg-green-50' : 'bg-red-50'}`}>
                            <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${actionType === 'accept' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                <i className={`fas ${actionType === 'accept' ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {actionType === "accept" ? "Konfirmasi Terima Penawaran" : "Konfirmasi Tolak Penawaran"}
                                </h2>
                            </div>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600">
                                Anda akan {actionType === "accept" ? "menerima" : "menolak"} penawaran sebesar{" "}
                                <span className="font-bold text-gray-800">{formatRupiah(request.accepted_price)}</span>. Apakah Anda yakin?
                            </p>
                            <div className="mt-6 flex justify-end gap-3">
                                <button onClick={() => setActionType(null)} className="cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50">
                                    Batal
                                </button>
                                <button onClick={handleConfirm} className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${actionType === 'accept' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                                    {`Ya, ${actionType === "accept" ? "Terima" : "Tolak"}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL BARU UNTUK KONFIRMASI SELESAI --- */}
            {showConfirmEndServiceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-lg" onClick={() => setShowConfirmEndServiceModal(false)}>
                    <div className="bg-white rounded-2xl shadow-lg w-full max-w-md m-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-5 flex items-center gap-4 bg-blue-50">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-600">
                                <i className="fas fa-handshake"></i>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Konfirmasi Penyelesaian Servis
                                </h2>
                            </div>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600">
                                Dengan ini Anda mengonfirmasi bahwa layanan telah selesai. Dana sebesar{" "}
                                <span className="font-bold text-gray-800">{formatRupiah(request.accepted_price)}</span> akan diteruskan kepada teknisi.
                                <br /><br />
                                Apakah Anda yakin?
                            </p>
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowConfirmEndServiceModal(false)}
                                    disabled={processing}
                                    className="cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleEndService}
                                    disabled={processing}
                                    className="cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:bg-gray-400"
                                >
                                    {processing ? 'Memproses...' : 'Ya, Selesaikan'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* === Kode untuk Popup/Modal Gambar === */}
            {isModalOpen && (
                <div
                    // Backdrop (latar belakang gelap)
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        // Container untuk gambar, mencegah modal tertutup saat gambar di-klik
                        className="relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Tombol Close */}
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute -top-4 -right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-800 shadow-lg transition hover:scale-110"
                        >
                            <i className="fas fa-times"></i>
                        </button>

                        {/* Gambar dalam ukuran besar */}
                        <img
                            src={`/storage/${requestPhotoPath}`}
                            alt="Foto Permintaan (Ukuran Penuh)"
                            className="max-h-[90vh] max-w-[90vw] rounded-lg"
                        />
                    </div>
                </div>
            )}
        </AppLayout>
    );
}