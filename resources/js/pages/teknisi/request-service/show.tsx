import React, { useState, useEffect, PropsWithChildren, useRef } from "react";
import { Head, Link, usePage, useForm, router } from "@inertiajs/react";
import axios from "axios";

// --- PALET WARNA & TIPE KONSISTEN ---
const PRIMARY = "#206BB0";
const SECONDARY = "#FFBD59";

// --- TIPE DATA ---
type AuthUser = { name: string; email: string; };
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
    user: { name: string };
};

type PageProps = {
    auth: { user: AuthUser };
    request: ServiceRequest;
    paymentStatus: "pending" | "settled" | "failure" | "refunded" | "cancelled" | false;
    needsPaymentAction: boolean;
    initialMessages: ChatMessage[];
    requestPhotoPath: string;
};

// --- TIPE DATA BARU UNTUK CHAT ---
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

// --- APP LAYOUT COMPONENT ---
function AppLayout({ user, children }: PropsWithChildren<{ user: AuthUser | null }>) {
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

// --- KOMPONEN: StatusTimeline ---
function StatusTimeline({ currentStatus }: { currentStatus: RequestStatus }) {
    const stepLabels: Record<RequestStatus, string> = {
        menunggu: "Dibuat",
        diproses: "Penawaran",
        dijadwalkan: "Dijadwalkan",
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
                            <div className="absolute top-3.5 right-1/2 h-0.5 w-full"
                                style={{
                                    background: isCompleted || isActive ? PRIMARY : '#e5e7eb',
                                }}
                            ></div>
                        )}
                        <div className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full"
                            style={{
                                backgroundColor: isCompleted || isActive ? PRIMARY : '#f3f4f6',
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

// --- KOMPONEN UTAMA: Show (Versi Teknisi) ---
export default function Show() {
    const { props } = usePage<PageProps>();
    const { auth, request, needsPaymentAction, initialMessages, requestPhotoPath } = props;
    const [shouldScroll, setShouldScroll] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        price_offer: request.accepted_price || '',
        request_id: request.id,
    });
    const [showPriceModal, setShowPriceModal] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false); // state open popup foto

    // --- STATE & LOGIKA CHAT ---
    const [newMessage, setNewMessage] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const chatContainerRef = useRef<HTMLDivElement>(null);

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


    // Use effect reload page langsung chat langsung kebawah 
    // Scroll otomatis ke bawah saat pertama kali halaman dimuat
    useEffect(() => {
        if (chatContainerRef.current) {
            const container = chatContainerRef.current;
            container.scrollTop = container.scrollHeight;
        }
    }, []);
    // Use effect ketika ada pesan baru container kebawah
    useEffect(() => {
        if (chatContainerRef.current && shouldScroll) {
            const container = chatContainerRef.current;
            container.scrollTop = container.scrollHeight;
            setShouldScroll(false);
        }
    }, [messages, shouldScroll]);


    const handleSubmitPrice = (e: React.FormEvent) => {
        e.preventDefault();
        post("/teknisi/permintaan-harga", {
            onSuccess: () => {
                reset('price_offer');
                setShowPriceModal(false);
            },
        });
    };

    // --- LOGIKA STATUS ---
    const getEffectiveStatus = (): RequestStatus => {
        // Jika status asli sudah 'selesai' atau 'dibatalkan', langsung gunakan itu.
        if (request.status === 'selesai' || request.status === 'dibatalkan') {
            return request.status;
        }

        // Jika status asli 'dijadwalkan', timeline harus menunjukkan 'dijadwalkan' (karena pembayaran lunas).
        if (request.status === 'dijadwalkan' && !needsPaymentAction) {
            return 'dijadwalkan';
        }

        // Jika sudah ada harga (accepted_price), berarti sudah masuk tahap 'diproses'
        // Ini mencakup: penawaran dikirim, disetujui, dan menunggu pembayaran.
        if (request.accepted_price) {
            return 'diproses';
        }

        // Jika tidak ada kondisi di atas yang terpenuhi, berarti statusnya masih 'menunggu'.
        return 'menunggu';
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
        setShouldScroll(true);

        try {
            await axios.post(`/teknisi/chat/request/${request.id}`, {
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

            <style>{`:root { --primary: ${PRIMARY}; --secondary: ${SECONDARY}; }`}</style>

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
                            <h2 className="text-base font-semibold text-gray-900">Progres Permintaan</h2>
                            <StatusTimeline currentStatus={effectiveStatus} />
                        </div>

                        {/* Kartu: Aksi dibutuhkan (beri penawaran) */}
                        {request.status === 'menunggu' && !request.accepted_price && (
                            <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-6 text-center shadow-sm">
                                <div className="grid h-12 w-12 mx-auto place-items-center rounded-full bg-amber-100">
                                    <i className="fas fa-dollar-sign text-2xl text-amber-600"></i>
                                </div>
                                <h2 className="mt-4 text-lg font-semibold text-gray-900">Aksi Dibutuhkan</h2>
                                <p className="mt-1 text-sm text-gray-600">Permintaan ini membutuhkan penawaran harga dari Anda.</p>
                                <button onClick={() => setShowPriceModal(true)} className="cursor-pointer mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold text-white shadow-lg transition hover:opacity-90" style={{ backgroundColor: PRIMARY }}>
                                    Buat Penawaran Harga
                                </button>
                            </div>
                        )}

                        {/* Kartu: Menunggu Persetujuan Pelanggan */}
                        {request.status === 'menunggu' && request.accepted_price && (
                            <div className="rounded-2xl p-6 text-center shadow-sm" style={{ background: `linear-gradient(135deg, rgba(255,189,89,0.1), rgba(255,189,89,0.2))` }}>
                                <i className="fas fa-hourglass-half fa-lg text-amber-700"></i>
                                <p className="mt-2 text-sm font-semibold text-gray-700">Menunggu Persetujuan Pelanggan</p>
                                <p className="text-xs text-gray-500">Harga penawaran <span className="font-bold">{formatRupiah(request.accepted_price)}</span> telah dikirim.</p>
                            </div>
                        )}

                        {/* Kartu: Menunggu Pembayaran dari Pelanggan */}
                        {request.status === 'dijadwalkan' && needsPaymentAction && (
                            <div className="rounded-2xl p-6 text-center shadow-sm" style={{ background: `linear-gradient(135deg, rgba(32,107,176,0.1), rgba(32,107,176,0.2))` }}>
                                <i className="fas fa-wallet fa-lg text-blue-700"></i>
                                <p className="mt-2 text-sm font-semibold text-gray-700">Menunggu Pembayaran Pelanggan</p>
                                <p className="text-xs text-gray-500">Proses akan berlanjut setelah pelanggan menyelesaikan pembayaran.</p>
                            </div>
                        )}

                        {/* Kartu: Perintah Kerja untuk Teknisi (Pembayaran Lunas) */}
                        {request.status === 'dijadwalkan' && !needsPaymentAction && (
                            <div
                                className="rounded-2xl p-6 text-white shadow-lg"
                                style={{ background: `linear-gradient(145deg, ${PRIMARY}, #1a5a96)` }}
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/20 border border-white/30 backdrop-blur-sm"
                                    >
                                        <i className="fas fa-shipping-fast text-3xl text-white animate-pulse"></i>
                                    </div>

                                    <div className="flex-1 text-left">
                                        <h2 className="text-2xl font-bold">Waktunya Beraksi!</h2>
                                        <p className="mt-1 text-sm text-white/80">
                                            Pembayaran pelanggan telah lunas. Segera berangkat dan selesaikan layanan sesuai jadwal.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 border-t border-white/20 pt-4 text-left">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-semibold text-white/70">Jadwal Pengerjaan:</span>
                                        <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium tracking-wider">
                                            {formatDate(request.scheduled_for)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Kartu: Pekerjaan Selesai (dari sudut pandang Teknisi) */}
                        {request.status === "selesai" && (
                            <div
                                className="rounded-2xl p-6 text-center text-white shadow-lg"
                                style={{ background: `linear-gradient(135deg, #10B981, #059669)` }} // Menggunakan warna hijau untuk status "selesai"
                            >
                                <div className="grid h-14 w-14 mx-auto place-items-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                                    <i className="fas fa-check-circle text-3xl text-white"></i>
                                </div>
                                <h2 className="mt-4 text-xl font-bold">Pekerjaan Selesai!</h2>
                                <p className="mt-1 text-sm text-white/80">Rincian pendapatan untuk layanan ini telah ditambahkan ke saldo Anda.</p>

                                {/* --- [MODIFIKASI] --- Menampilkan rincian pendapatan --- */}
                                <div className="mt-5 rounded-lg bg-white/10 p-4">
                                    <dl>
                                        <div className="flex justify-between items-center text-sm">
                                            <dt className="text-white/70">Total Pembayaran</dt>
                                            <dd className="font-medium text-white/70 line-through">
                                                {formatRupiah(request.accepted_price)}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between items-center text-sm mt-1">
                                            <dt className="text-white/70">Potongan Biaya Platform (10%)</dt>
                                            <dd className="font-medium text-white/70">
                                                - {formatRupiah(request.accepted_price * 0.10)}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between items-center font-bold text-lg mt-2 pt-2 border-t border-white/20">
                                            <dt>Pendapatan Bersih</dt>
                                            <dd className="text-2xl" style={{ color: SECONDARY }}>
                                                {formatRupiah(request.accepted_price * 0.90)}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>

                                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <Link
                                        href="/teknisi/wallet"
                                        className="w-full sm:w-auto cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold bg-white text-gray-800 shadow-sm transition hover:scale-105"
                                    >
                                        <i className="fas fa-wallet mr-2"></i>
                                        Lihat Saldo Wallet
                                    </Link>
                                    <Link
                                        href="/teknisi/permintaan" // Mengarahkan ke daftar pekerjaan
                                        className="w-full sm:w-auto text-xs text-white/80 hover:text-white hover:underline transition"
                                    >
                                        Kembali ke Daftar Pekerjaan
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Kartu: Permintaan Dibatalkan */}
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
                                        href="/teknisi/home"
                                        className="w-full sm:w-auto text-xs text-gray-500 hover:text-gray-800 hover:underline transition"
                                    >
                                        Kembali ke Daftar Pekerjaan
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Meta data*/}
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="text-base font-semibold text-gray-900">Informasi Klien & Permintaan</h2>
                            <dl className="divide-y divide-gray-100 mt-4">
                                <div className="py-4 grid grid-cols-1 sm:grid-cols-3 sm:gap-4">
                                    <dt className="text-sm text-gray-500">Kategori</dt>
                                    <dd className="mt-1 text-sm font-medium text-gray-800 sm:col-span-2 sm:mt-0">{request.category}</dd>
                                </div>
                                <div className="py-4 grid grid-cols-1 sm:grid-cols-3 sm:gap-4">
                                    <dt className="text-sm text-gray-500">Jadwal dari Klien</dt>
                                    <dd className="mt-1 text-sm font-medium text-gray-800 sm:col-span-2 sm:mt-0">{formatDate(request.scheduled_for)}</dd>
                                </div>
                                <div className="py-4 grid grid-cols-1 sm:grid-cols-3 sm:gap-4">
                                    <dt className="text-sm text-gray-500">Deskripsi Masalah</dt>
                                    <dd className="mt-1 text-sm font-medium text-gray-800 sm:col-span-2 sm:mt-0 whitespace-pre-wrap">{request.description}</dd>
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

                    {/* chat */}
                    <div id="section-chat-user" className="lg:col-span-1 rounded-2xl border border-gray-200 bg-white shadow-sm flex flex-col overflow-hidden h-[73vh] md:h-[60vh]">
                        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                            <img src={`https://ui-avatars.com/api/?name=Client&background=random`} alt={'Client'} className="h-10 w-10 rounded-full" />
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900">Diskusi dengan Client</h2>
                            </div>
                        </div>

                        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg) => (
                                // LOGIKA PEMILIK PESAN DIPERBAIKI
                                <div key={msg.id} className={`flex items-end gap-2 ${msg.sender.id === auth.user.id ? "justify-end" : "justify-start"}`}>
                                    <div
                                        // KONTEN PESAN DIAMBIL DARI 'msg.content'
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

            {/* Modal Penawaran Harga */}
            {showPriceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-lg" onClick={() => setShowPriceModal(false)}>
                    <div className="bg-white rounded-2xl shadow-lg w-full max-w-md m-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <form onSubmit={handleSubmitPrice}>
                            <input type="hidden" name="request_id" value={data.request_id} />
                            <div className="p-6">
                                <h2 className="text-lg font-semibold text-gray-900">Buat Penawaran Harga</h2>
                                <p className="mt-1 text-sm text-gray-600">Masukkan total biaya jasa dan spare part jika ada.</p>
                                <div className="relative mt-4">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className="text-gray-500 sm:text-sm">Rp</span>
                                    </div>
                                    <input
                                        type="number"
                                        name="price_offer"
                                        value={data.price_offer}
                                        onChange={(e) => setData('price_offer', e.target.value)}
                                        className="block w-full rounded-lg border-gray-300 pl-8 pr-3 py-2.5 text-lg focus:border-transparent focus:ring-2"
                                        style={{ '--tw-ring-color': SECONDARY } as React.CSSProperties}
                                        placeholder="150000"
                                        autoFocus
                                    />
                                </div>
                                {errors.price_offer && <p className="mt-1 text-sm text-red-500">{errors.price_offer}</p>}
                            </div>
                            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowPriceModal(false)} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50">
                                    Batal
                                </button>
                                <button type="submit" disabled={processing} className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50" style={{ backgroundColor: PRIMARY }}>
                                    {processing ? "Mengirim..." : "Kirim Penawaran"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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