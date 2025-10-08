import React, { useState, PropsWithChildren } from "react";
import { Head, Link, usePage } from "@inertiajs/react";

// --- PALET WARNA & TIPE ---
const PRIMARY = "#206BB0";
const SECONDARY = "#FFBD59";

// --- DEFINISI TIPE ---
type AuthUser = { id: number; name: string; email: string; };
type PageProps = {
    auth: { user: AuthUser };
};

// --- [BARU] --- Komponen untuk item Pertanyaan (Accordion-like) ---
function FaqItem({ title, children }: { title: string, children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-200">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between py-5 text-left text-lg font-semibold text-gray-800"
            >
                <span>{title}</span>
                <i className={`fas fa-chevron-down transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>
            <div
                className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
                <div className="overflow-hidden">
                    <div className="prose max-w-none pb-5 text-gray-600">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}


// --- AppLayout (Sama seperti halaman Pekerjaan) ---
function TechnicianAppLayout({ user, children }: PropsWithChildren<{ user: AuthUser | null }>) {
    const { url } = usePage();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const initial = user?.name.charAt(0).toUpperCase() ?? 'T';
    const isActive = (path: string) => url.startsWith(path);

    return (
        <div className="min-h-screen bg-gray-100/50">
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/80">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link href="/" className="flex items-center gap-2 text-xl font-bold" style={{ color: PRIMARY }}><img src="/storage/assets/logo.png" alt="Benerin Indonesia" className="w-[150px] rounded object-contain" /></Link>
                        <nav className="hidden md:flex md:items-center md:gap-x-8">
                            <Link href="/teknisi/home" className={`flex items-center gap-2 text-sm font-semibold transition ${isActive('/teknisi/home') ? 'text-blue-600' : 'text-gray-600'}`}><i className="fas fa-home" /> Beranda</Link>
                            <Link href="/teknisi/permintaan" className={`flex items-center gap-2 text-sm font-semibold transition ${isActive('/teknisi/permintaan') ? 'text-blue-600' : 'text-gray-600'}`}><i className="fas fa-briefcase" /> Pekerjaan</Link>
                            <Link href="/teknisi/jadwal" className={`flex items-center gap-2 text-sm font-semibold transition ${isActive('/teknisi/jadwal') ? 'text-blue-600' : 'text-gray-600'}`}><i className="fas fa-calendar-alt" /> Jadwal</Link>
                            {/* --- [BARU] --- Menambahkan link Bantuan --- */}
                            {/* <Link href="/teknisi/bantuan" className={`flex items-center gap-2 text-sm font-semibold transition ${isActive('/teknisi/bantuan') ? 'text-blue-600' : 'text-gray-600'}`}><i className="fas fa-question-circle" /> Bantuan</Link> */}
                        </nav>
                        <div className="relative">
                            <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} onBlur={() => setTimeout(() => setIsProfileMenuOpen(false), 150)} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2" style={{ '--tw-ring-color': PRIMARY } as React.CSSProperties}>{initial}</button>
                            {isProfileMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    {/* ... menu dropdown ... */}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            <main>{children}</main>
        </div>
    );
}

// --- KOMPONEN UTAMA HALAMAN ---
export default function Index() {
    const { auth } = usePage<PageProps>().props;

    return (
        <TechnicianAppLayout user={auth.user}>
            <Head title="Pusat Bantuan Teknisi" />
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* --- Header Halaman disesuaikan untuk Bantuan --- */}
                <header className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${PRIMARY}, #1a5a96)` }}>
                    <div className="absolute -right-16 -bottom-16 opacity-10"><i className="fas fa-question-circle text-[16rem]"></i></div>
                    <div className="relative z-10">

                        {/* --- [BARU] --- Tombol Kembali --- */}
                        <button
                            onClick={() => window.history.back()}
                            className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/80 transition hover:text-white"
                        >
                            <i className="fas fa-arrow-left fa-xs" />
                            <span>Kembali</span>
                        </button>

                        <h1 className="text-3xl font-bold tracking-tight">Pusat Bantuan</h1>
                        <p className="mt-1 opacity-80">Kami siap membantu. Temukan jawaban dari pertanyaan Anda di sini.</p>
                    </div>
                </header>

                {/* --- Konten Halaman Bantuan --- */}
                <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Kolom Kiri: Daftar Pertanyaan (FAQ) */}
                    <div className="lg:col-span-2">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pertanyaan Umum (FAQ)</h2>
                            <div className="space-y-2">
                                <FaqItem title="Bagaimana cara menerima pekerjaan baru?">
                                    <p>Pastikan status Anda "Online" dan ketersediaan layanan Anda aktif di halaman Beranda. Anda akan menerima notifikasi untuk setiap pekerjaan baru yang masuk dan sesuai dengan keahlian Anda.</p>
                                </FaqItem>
                                <FaqItem title="Apa yang harus dilakukan setelah menerima penawaran?">
                                    <p>Setelah Anda memberikan penawaran harga, tunggu konfirmasi dari pelanggan. Jika pelanggan setuju, status permintaan akan berubah menjadi "Dijadwalkan" dan Anda harus segera menghubungi pelanggan untuk konfirmasi waktu dan lokasi.</p>
                                </FaqItem>
                                <FaqItem title="Bagaimana cara melakukan pencairan dana (payout)?">
                                    <p>Anda dapat mengajukan pencairan dana melalui halaman "Wallet & Saldo". Pastikan informasi rekening bank Anda di halaman Profil sudah benar. Pencairan dana akan diproses oleh tim kami dalam 1-2 hari kerja.</p>
                                </FaqItem>
                                <FaqItem title="Apa yang terjadi jika pelanggan membatalkan pesanan?">
                                    <p>Jika pelanggan membatalkan pesanan sebelum pekerjaan dimulai, Anda tidak akan menerima pembayaran. Jika pembatalan terjadi setelah ada kesepakatan atau saat pekerjaan sedang berlangsung, silakan hubungi Customer Service kami untuk mediasi.</p>
                                </FaqItem>
                            </div>
                        </div>
                    </div>

                    {/* Kolom Kanan: Kontak Bantuan */}
                    <div className="lg:col-span-1">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-900">Butuh Bantuan Lebih Lanjut?</h3>
                            <p className="mt-2 text-sm text-gray-600">Tim support kami siap membantu Anda jika Anda tidak menemukan jawaban di sini.</p>
                            <div className="mt-6 space-y-4">
                                <a href="https://wa.me/6287721149863" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 rounded-xl border border-gray-200 p-4 transition-all hover:border-green-400 hover:bg-green-50">
                                    <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-lg bg-green-100 text-green-600">
                                        <i className="fab fa-whatsapp text-2xl"></i>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">Chat via WhatsApp</p>
                                        <p className="text-xs text-gray-500">Respon cepat (08:00 - 17:00)</p>
                                    </div>
                                </a>
                                <a href="mailto:benerin814@gmail.com" className="group flex items-center gap-4 rounded-xl border border-gray-200 p-4 transition-all hover:border-blue-400 hover:bg-blue-50">
                                    <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-lg bg-blue-100 text-blue-600">
                                        <i className="fas fa-envelope text-xl"></i>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">Kirim Email</p>
                                        <p className="text-xs text-gray-500">benerin814@gmail.com</p>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </TechnicianAppLayout>
    );
}