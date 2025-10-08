import React, { useState, PropsWithChildren, useRef } from "react";
import { Head, Link, usePage, useForm } from "@inertiajs/react";

// --- PALET WARNA & TIPE ---
const PRIMARY = "#206BB0";
const SECONDARY = "#FFBD59";

// --- DEFINISI TIPE ---
type AuthUser = { id: number; name: string; email: string; };

type UserProfile = {
    id: number;
    name: string;
    email: string;
    role: string;
    phone: string | null;
    photo_url: string | null;
    bank_name: string | null;
    account_name: string | null;
    account_number: string | null;
};

type PageProps = {
    auth: { user: AuthUser };
    userProfile: UserProfile;
    status?: string;
    errors: Partial<Record<keyof UserProfile | 'photo', string>>;
};

// --- AppLayout
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
// --- Komponen DataItem
const DataItem = ({ icon, label, value, children, isEditing, isSensitive = false, errorMessage }) => (
    <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <i className={`fas ${icon} w-4 text-center text-gray-400`}></i>
            <span>{label}</span>
        </label>
        <div className="mt-1">
            {isEditing ? (
                <>
                    {children}
                    {errorMessage && <p className="mt-1.5 text-xs text-red-600">{errorMessage}</p>}
                </>
            ) : (
                <div className={`text-base font-semibold text-gray-800 px-3 py-2 min-h-[44px] flex items-center ${isSensitive ? 'blur-sm transition-all hover:blur-none' : ''}`}>
                    {value || <span className="italic text-gray-400 font-normal">Belum diisi</span>}
                </div>
            )}
        </div>
    </div>
);

// --- KOMPONEN UTAMA HALAMAN PROFIL ---
export default function Index() {
    const { auth, userProfile, status, errors } = usePage<PageProps>().props;
    const [isEditing, setIsEditing] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(userProfile.photo_url);
    const [showSuccessNotification, setShowSuccessNotification] = useState(false);

    const { data, setData, post, processing, reset, clearErrors } = useForm({
        name: userProfile.name,
        email: userProfile.email,
        phone: userProfile.phone || '',
        bank_name: userProfile.bank_name || '',
        account_name: userProfile.account_name || '',
        account_number: userProfile.account_number || '',
        photo: null as File | null,
        _method: 'patch',
    });

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { setData('photo', file); setPhotoPreview(URL.createObjectURL(file)); }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/user/profile', {
            onSuccess: () => { setIsEditing(false); setShowSuccessNotification(true); setTimeout(() => setShowSuccessNotification(false), 3000); },
            preserveState: true,
        });
    };

    const cancelEditing = () => { reset(); clearErrors(); setPhotoPreview(userProfile.photo_url); setIsEditing(false); };

    const inputClass = "block w-full rounded-lg border border-gray-400 bg-white p-3 text-base text-gray-900 shadow-inner transition-all duration-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50";

    return (
        <AppLayout user={auth.user}>
            <Head title="Profil Saya" />
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    {/* Header untuk Desktop (sm ke atas) */}
                    <header
                        className="hidden sm:block relative overflow-hidden rounded-2xl shadow-xl border-l-4"
                        style={{
                            background: `linear-gradient(120deg, ${PRIMARY}, #1c4b7a)`,
                            borderColor: SECONDARY
                        }}
                    >
                        <div className="absolute -right-10 -top-10 opacity-[0.04]">
                            <i className="fas fa-user-circle text-[20rem] text-white transform -rotate-12"></i>
                        </div>
                        <div className="relative z-10 p-6 flex justify-between items-center">
                            <div className="text-white">
                                <h1 className="text-3xl font-bold tracking-tight" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.2)' }}>
                                    {isEditing ? 'Mode Edit Profil Akun' : 'Profil Akun'}
                                </h1>
                                <p className="mt-2 max-w-2xl text-indigo-100">
                                    {isEditing ? 'Pastikan semua data yang Anda masukkan sudah benar.' : 'Kelola informasi akun Anda.'}
                                </p>
                            </div>
                            {/* Tombol Edit/Batal untuk Desktop */}
                            <div className="flex-shrink-0 ml-6">
                                <button onClick={() => isEditing ? cancelEditing() : setIsEditing(true)} className={`group inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-base font-bold shadow-lg transition-all duration-300 ease-in-out hover:scale-105 sm:w-auto ${isEditing ? 'bg-amber-400 text-amber-900 hover:bg-amber-500' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                                    {isEditing
                                        ? <><i className="fas fa-times transition-transform duration-300 group-hover:rotate-90" /><span>Batal Edit</span></>
                                        : <><i className="fas fa-edit" /><span>Edit Profil</span></>
                                    }
                                </button>
                            </div>
                        </div>
                        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10"></div>
                    </header>

                    {/* Header Bar untuk Mobile (di bawah sm) */}
                    <div className="sm:hidden flex justify-between items-center pb-4 border-b border-gray-200">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Profil' : 'Profil Saya'}</h1>
                            <p className="text-sm text-gray-500 mt-1">{isEditing ? 'Periksa kembali data Anda.' : 'Kelola informasi akun Anda.'}</p>
                        </div>
                        {/* Tombol Edit/Batal untuk Mobile */}
                        <div className="flex-shrink-0 ml-4">
                            <button onClick={() => isEditing ? cancelEditing() : setIsEditing(true)} className={`group inline-flex items-center justify-center gap-2 rounded-lg font-bold shadow-md transition-all duration-300 ease-in-out hover:scale-105 px-4 py-2 text-sm ${isEditing ? 'bg-amber-400 text-amber-900 hover:bg-amber-500' : 'bg-[#206BB0] text-white hover:bg-blue-700'}`}>
                                {isEditing
                                    ? <><i className="fas fa-times" /><span>Batal</span></>
                                    : <><i className="fas fa-edit" /><span>Edit</span></>
                                }
                            </button>
                        </div>
                    </div>
                </div>

                <div className="my-6 space-y-4">
                    {showSuccessNotification && status === 'profile-updated' && (
                        <div className="rounded-lg bg-green-100 p-4 text-sm font-medium text-green-800 flex items-center gap-3"><i className="fas fa-check-circle"></i><p>Profil berhasil diperbarui!</p></div>
                    )}
                    {Object.keys(errors).length > 0 && isEditing && (
                        <div className="rounded-lg bg-red-100 p-4 text-sm font-medium text-red-800 flex items-center gap-3"><i className="fas fa-exclamation-triangle"></i><p>Terdapat kesalahan pada input Anda. Silakan periksa kembali.</p></div>
                    )}
                </div>

                <form onSubmit={submit} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                            <div className="relative mx-auto h-36 w-36">
                                <img src={photoPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random&size=128`} alt="Foto Profil" className="mx-auto h-full w-full rounded-full object-cover ring-4 ring-white shadow-lg" />
                                {/* {isEditing && (
                                    <>
                                        <button type="button" onClick={() => photoInputRef.current?.click()} className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 hover:scale-110 hover:bg-amber-100"><i className="fas fa-camera text-lg text-gray-600"></i></button>
                                        <input type="file" ref={photoInputRef} className="hidden" onChange={handlePhotoChange} accept="image/png, image/jpeg" />
                                    </>
                                )} */}
                                {isEditing && (
                                    <>
                                        <button
                                            type="button"
                                            disabled  // tombol tidak bisa diklik
                                            className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 hover:scale-110 hover:bg-amber-100"
                                        >
                                            <i className="fas fa-camera text-lg text-gray-600"></i>
                                        </button>
                                        <input
                                            type="file"
                                            ref={photoInputRef}
                                            className="hidden"
                                            disabled  // input file tidak bisa dipilih
                                            onChange={handlePhotoChange}
                                            accept="image/png, image/jpeg"
                                        />
                                    </>
                                )}

                            </div>
                            <h2 className="mt-5 text-2xl font-bold text-gray-900">{isEditing ? data.name : userProfile.name}</h2>
                            <p className="text-base text-gray-500">{userProfile.email}</p>
                            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-semibold uppercase text-amber-800"><i className="fas fa-user-check"></i><span>{userProfile.role}</span></p>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className={`rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm transition-colors ${isEditing ? 'bg-amber-50/20' : 'bg-white'}`}>
                            <h3 className="text-xl font-bold text-gray-900">Detail Akun</h3>
                            <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                                <DataItem icon="fa-user" label="Nama Lengkap" value={userProfile.name} isEditing={isEditing} errorMessage={errors.name}>
                                    <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} className={inputClass} />
                                </DataItem>
                                <DataItem icon="fa-envelope" label="Alamat Email" value={userProfile.email} isEditing={isEditing} errorMessage={errors.email}>
                                    <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} className={inputClass} />
                                </DataItem>
                                <DataItem icon="fa-phone" label="Nomor Telepon" value={userProfile.phone} isEditing={isEditing} errorMessage={errors.phone}>
                                    <input type="tel" value={data.phone} onChange={e => setData('phone', e.target.value)} className={inputClass} />
                                </DataItem>
                            </div>
                        </div>

                        <div className={`mt-8 rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm transition-colors ${isEditing ? 'bg-amber-50/20' : 'bg-white'}`}>
                            <h3 className="text-xl font-bold text-gray-900">Informasi Bank</h3>
                            <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                                <DataItem icon="fa-university" label="Nama Bank" value={userProfile.bank_name} isEditing={isEditing} errorMessage={errors.bank_name}>
                                    <input type="text" value={data.bank_name} onChange={e => setData('bank_name', e.target.value)} className={inputClass} />
                                </DataItem>
                                <DataItem icon="fa-id-card" label="Nama Pemilik Rekening" value={userProfile.account_name} isEditing={isEditing} errorMessage={errors.account_name}>
                                    <input type="text" value={data.account_name} onChange={e => setData('account_name', e.target.value)} className={inputClass} />
                                </DataItem>
                                <DataItem icon="fa-credit-card" label="Nomor Rekening" value={userProfile.account_number} isEditing={isEditing} isSensitive={true} errorMessage={errors.account_number}>
                                    <input type="text" value={data.account_number} onChange={e => setData('account_number', e.target.value)} className={inputClass} />
                                </DataItem>
                            </div>
                        </div>

                        {isEditing && (
                            <div className="mt-8 flex justify-end gap-4">
                                <button type="button" onClick={cancelEditing} className="rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50">Batal</button>
                                <button type="submit" disabled={processing} className="inline-flex items-center justify-center rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {processing ? <><i className="fas fa-spinner animate-spin mr-2" /> Menyimpan...</> : <><i className="fas fa-save mr-2" /> Simpan Perubahan</>}
                                </button>
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}