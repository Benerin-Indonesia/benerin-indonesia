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

// --- Komponen untuk item Pertanyaan (Accordion-like) ---
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


// --- AppLayout (Layout untuk User Biasa) ---
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
              <Link href="/user/home" className="flex items-center gap-2 text-sm font-semibold transition" style={{ color: PRIMARY }}>
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
          <Link href="/user/home" className="flex flex-col items-center justify-center gap-1 text-xs font-medium" style={{ color: PRIMARY }}>
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

// --- KOMPONEN UTAMA HALAMAN ---
export default function Index() {
  const { auth } = usePage<PageProps>().props;

  return (
    <AppLayout user={auth.user}>
      <Head title="Pusat Bantuan Pelanggan" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Halaman disesuaikan untuk User */}
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

        {/* Konten Halaman Bantuan */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Kolom Kiri: Daftar Pertanyaan (FAQ) untuk User */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Pertanyaan Umum (FAQ)</h2>
              <div className="space-y-2">
                <FaqItem title="Bagaimana cara membuat permintaan servis baru?">
                  <p>Anda dapat membuat permintaan baru dengan menekan tombol "Buat Permintaan" di halaman Beranda. Isi formulir dengan detail kerusakan, unggah foto jika perlu, dan tentukan jadwal yang Anda inginkan.</p>
                </FaqItem>
                <FaqItem title="Bagaimana proses pembayaran bekerja?">
                  <p>Setelah teknisi memberikan penawaran harga dan Anda menyetujuinya, Anda akan diminta untuk melakukan pembayaran melalui Midtrans. Dana Anda akan kami tahan (sistem *escrow*) dan baru akan diteruskan ke teknisi setelah Anda mengonfirmasi bahwa pekerjaan telah selesai.</p>
                </FaqItem>
                <FaqItem title="Bagaimana cara mengajukan pengembalian dana (refund)?">
                  <p>Jika layanan tidak sesuai atau teknisi tidak datang, Anda dapat mengajukan *refund* melalui halaman detail permintaan servis terkait. Tombol *refund* akan muncul setelah pembayaran berhasil dan sebelum layanan ditandai selesai.</p>
                </FaqItem>
                <FaqItem title="Apakah saya bisa menghubungi teknisi secara langsung?">
                  <p>Ya, setelah permintaan Anda diterima oleh seorang teknisi, fitur *chat* akan tersedia di halaman detail permintaan. Anda dapat berdiskusi langsung dengan teknisi mengenai detail pekerjaan.</p>
                </FaqItem>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Kontak Bantuan */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900">Butuh Bantuan Lebih Lanjut?</h3>
              <p className="mt-2 text-sm text-gray-600">Tim Customer Service kami siap membantu Anda.</p>
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
    </AppLayout>
  );
}