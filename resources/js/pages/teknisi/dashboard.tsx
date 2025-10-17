import React, { useEffect, useState, PropsWithChildren } from "react";
import { Head, Link, usePage, router } from "@inertiajs/react"; // <-- [TAMBAHAN] import 'router'

// --- COLOR & TYPE DEFINITIONS ---
const PRIMARY = "#206BB0";
type AuthUser = { id: number; name: string; email: string; role: string };

type JobItem = {
  id: number;
  title: string;
  category: string;
  description: string;
  scheduled_for?: string | null;
  status: "menunggu" | "diproses" | "dijadwalkan" | "selesai" | "dibatalkan";
  price_offer?: number | null;
  distance_km?: number | null;
};

// --- [BARU] Tipe untuk data kategori dari backend ---
type CategoryWithStatus = {
  id: number;
  name: string;
  icon: string;
  is_active: boolean;
};

type PageProps = {
  auth?: { user: AuthUser | null };
  stats?: { today: number; in_progress: number; revenue_today: number };
  incoming?: JobItem[];
  verification?: "verified" | "pending" | "rejected";
  categories?: CategoryWithStatus[]; // <-- [BARU]
};

function techStorageSrc(icon?: string | null) {
  if (!icon) return "";
  if (/^https?:\/\//i.test(icon)) return icon;
  const cleaned = icon.replace(/^public\//, "").replace(/^\/+/, "");
  return `/storage/${cleaned}`;
}


// --- HELPER FUNCTIONS ---
function money(n?: number | null) {
  if (n == null) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function StatusPill({ status }: { status: JobItem["status"] }) {
  const map: Record<JobItem["status"], { text: string; cls: string }> = {
    menunggu: { text: "Baru", cls: "bg-blue-100 text-blue-800" },
    diproses: { text: "Ditawar", cls: "bg-amber-100 text-amber-800" },
    dijadwalkan: { text: "Dijadwalkan", cls: "bg-indigo-100 text-indigo-800" },
    selesai: { text: "Selesai", cls: "bg-green-100 text-green-800" },
    dibatalkan: { text: "Dibatalkan", cls: "bg-red-100 text-red-800" },
  };
  const m = map[status];
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${m.cls}`}>
      {m.text}
    </span>
  );
}

// --- [BARU] Komponen Toggle Switch ---
function ToggleSwitch({ enabled, onChange, loading = false }: { enabled: boolean; onChange: (enabled: boolean) => void; loading?: boolean }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`
                cursor-pointer relative h-7 w-12 rounded-full 
                transition-colors duration-300 ease-in-out 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                ${enabled ? 'bg-green-500' : 'bg-gray-300'}
            `}
      role="switch"
      aria-checked={enabled}
      disabled={loading}
    >
      {loading ? (
        <i className="fas fa-spinner fa-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/80"></i>
      ) : (
        <span
          className={`
                        absolute top-1 inline-block h-5 w-5 rounded-full bg-white shadow ring-1 ring-black/5 
                        transition-all duration-300 ease-in-out 
                        ${enabled ? 'left-6' : 'left-1'}
                    `}
        />
      )}
    </button>
  );
}


// --- CONFIRMATION MODAL COMPONENT ---
function ConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  title,
  children,
  confirmText,
  confirmColor,
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  children: React.ReactNode;
  confirmText: string;
  confirmColor: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" aria-modal="true" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl m-4">
        <div className="flex items-start gap-4">
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${confirmColor.replace('bg-', 'bg-')}/10`}>
            <i className={`fas fa-question-circle fa-lg ${confirmColor.replace('bg-', 'text-')}`} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <p className="mt-2 text-gray-600">{children}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="border cursor-pointer rounded-lg px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className={`cursor-pointer rounded-lg px-5 py-2 font-semibold text-white shadow-sm transition hover:opacity-90 ${confirmColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}


// --- APP LAYOUT COMPONENT ---
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
                className="w-[150px] rounded object-contain"
              />
            </Link>
            <nav className="hidden md:flex md:items-center md:gap-x-8">
              <Link href="/teknisi/home" className="flex items-center gap-2 text-sm font-semibold" style={{ color: PRIMARY }}><i className="fas fa-home" /> Beranda</Link>
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
          <Link href="/teknisi/home" className="flex flex-col items-center justify-center gap-1 text-xs" style={{ color: PRIMARY }}><i className="fas fa-home text-xl"></i><span>Beranda</span></Link>
          <Link href="/teknisi/permintaan" className="flex flex-col items-center justify-center gap-1 text-xs text-gray-600"><i className="fas fa-briefcase text-xl"></i><span>Pekerjaan</span></Link>
          <Link href="/teknisi/jadwal" className="flex flex-col items-center justify-center gap-1 text-xs text-gray-600"><i className="fas fa-calendar-alt text-xl"></i><span>Jadwal</span></Link>
          <Link href="/teknisi/profile" className="flex flex-col items-center justify-center gap-1 text-xs text-gray-600"><i className="fas fa-user-circle text-xl"></i><span>Profil</span></Link>
        </nav>
      </footer>
      <div className="h-16 md:hidden"></div>
    </div>
  );
}


// --- MAIN COMPONENT: TechnicianDashboard ---
export default function TechnicianDashboard() {
  const { auth, stats, incoming, verification, categories: initialCategories } = usePage<PageProps>().props || {};
  const name = auth?.user?.name ?? "Teknisi";
  const statsData = stats ?? { today: 0, in_progress: 0, revenue_today: 0 };
  const incomingData: JobItem[] = incoming ?? [];

  // --- STATE MANAGEMENT ---
  const [available, setAvailable] = useState(true);
  const [modalState, setModalState] = useState({
    isOpen: false,
    targetStatus: null as boolean | null,
  });

  // State management untuk toggle kategori
  const [categories, setCategories] = useState<CategoryWithStatus[]>(initialCategories || []);
  const [loadingCategoryId, setLoadingCategoryId] = useState<number | null>(null);

  // Gunakan useEffect untuk memastikan state diupdate saat props berubah
  useEffect(() => {
    setCategories(initialCategories || []);
  }, [initialCategories]);

  const handleCategoryToggle = (categoryId: number, active: boolean) => {
    setLoadingCategoryId(categoryId);
    // Optimistic UI update
    setCategories(prev => prev.map(cat => cat.id === categoryId ? { ...cat, is_active: active } : cat));

    router.post('/teknisi/categories/toggle-status', {
      category_id: categoryId,
      active: active
    }, {
      preserveScroll: true,
      onError: () => {
        // Jika gagal, kembalikan ke state asli dari props
        alert('Gagal memperbarui status. Silakan muat ulang halaman.');
        setCategories(initialCategories || []);
      },
      onFinish: () => {
        setLoadingCategoryId(null);
      }
    });
  };
  // --- [AKHIR BAGIAN BARU] ---


  // --- MODAL HANDLERS ---
  const handleToggleClick = () => {
    const targetStatus = !available;
    setModalState({ isOpen: true, targetStatus: targetStatus });
  };

  // --- [MODIFIKASI] --- Fungsi ini sekarang mengirim data ke backend ---
  const handleConfirmStatusChange = () => {
    if (modalState.targetStatus !== null) {
      const newStatus = modalState.targetStatus;

      // Kirim request ke backend untuk update semua service
      router.post('/teknisi/availability/toggle', {
        available: newStatus,
      }, {
        preserveScroll: true,
        onSuccess: () => {
          // Jika berhasil, update state lokal
          setAvailable(newStatus);
        },
        onError: () => {
          alert('Gagal memperbarui status ketersediaan. Silakan coba lagi.');
        }
      });
    }
    // Tutup modal
    setModalState({ isOpen: false, targetStatus: null });
  };

  const handleCancelStatusChange = () => {
    setModalState({ isOpen: false, targetStatus: null });
  };

  // --- ANIMATION EFFECT ---
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    const prepare = (el: HTMLElement) => el.classList.add("reveal-prepare");
    const show = (el: HTMLElement) => el.classList.add("show");
    elements.forEach(prepare);

    if ("IntersectionObserver" in window) {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              show(entry.target as HTMLElement);
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
      elements.forEach((el) => obs.observe(el));
      return () => obs.disconnect();
    } else {
      elements.forEach(show);
    }
  }, []);

  return (
    <TechnicianAppLayout user={auth?.user ?? null}>
      <Head title="Beranda Teknisi" />
      <style>{`
        :root { --ease: cubic-bezier(.22,.8,.28,1); }
        .reveal { transition: all .6s var(--ease); }
        .reveal-prepare { opacity: 0; transform: translateY(20px); }
        .reveal-prepare.show { opacity: 1; transform: none; }
      `}</style>

      <ConfirmationModal
        isOpen={modalState.isOpen}
        onConfirm={handleConfirmStatusChange}
        onCancel={handleCancelStatusChange}
        title={modalState.targetStatus ? "Ubah Status Menjadi Online?" : "Ubah Status Menjadi Offline?"}
        confirmText={modalState.targetStatus ? "Ya, Jadikan Online" : "Ya, Jadikan Offline"}
        confirmColor={modalState.targetStatus ? "bg-green-500" : "bg-red-500"}
      >
        {modalState.targetStatus ? (
          "Saat online, Anda akan mulai menerima notifikasi pekerjaan baru yang sesuai dengan keahlian Anda."
        ) : (
          "Anda tidak akan menerima permintaan pekerjaan baru hingga kembali online. Pekerjaan yang sedang berjalan tidak akan terpengaruh."
        )}
      </ConfirmationModal>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* --- MAIN CONTENT (LEFT/TOP) --- */}
          <div className="flex flex-col gap-8 lg:col-span-2">

            {/* --- HEADER CARD --- */}
            <section
              className="reveal relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm"
            >
              {/* Elemen Dekoratif di Latar Belakang */}
              <div
                className="absolute -right-20 -bottom-20 opacity-5"
                style={{ color: PRIMARY }}
              >
                <i className="fas fa-tools text-[20rem] transform -rotate-12"></i>
              </div>

              <div className="relative p-6">
                <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
                  <div>
                    {/* Sapaan dinamis sesuai waktu --- */}
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                      Selamat {
                        (() => {
                          const hour = new Date().getHours();
                          if (hour < 11) return "Pagi";
                          if (hour < 15) return "Siang";
                          if (hour < 19) return "Sore";
                          return "Malam";
                        })()
                      }, {name.split(" ")[0]}! 👨‍🔧
                    </h1>
                    <p className="mt-1.5 text-gray-600">
                      Semoga harimu menyenangkan dan penuh semangat!
                    </p>
                  </div>

                  {/* Toggle Status yang lebih informatif --- */}
                  {/* <div
                    className={`
                    flex w-full shrink-0 items-center justify-between rounded-xl border p-2 pl-4 transition-colors duration-300 sm:w-auto
                    ${available ? 'border-green-200 bg-green-50/50' : 'border-gray-200/80 bg-gray-50/80'}
                `}>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full transition-colors ${available ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                      <span className="text-sm mr-4 font-bold text-gray-800">
                        {available ? "Online" : "Offline"}
                      </span>
                    </div>
                    <button
                      onClick={handleToggleClick}
                      className={`cursor-pointer relative h-7 w-12 rounded-full transition ${available ? 'bg-green-500' : 'bg-gray-300'}`}
                      aria-pressed={available}>
                      <span className={`absolute top-1 inline-block h-5 w-5 rounded-full bg-white shadow ring-1 ring-black/5 transition ${available ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div> */}
                </div>
              </div>
            </section>

            {/* --- [CATEGORIES STATUS TOGGLE] --- */}
            <section className="reveal" style={{ animationDelay: '150ms' }}>
              <h2 className="text-xl font-bold text-gray-900">Ketersediaan Layanan</h2>
              <p className="mt-1 text-sm text-gray-600 mb-5">Aktifkan jenis layanan yang siap Anda kerjakan untuk menerima permintaan.</p>

              {/* --- [REVISI TOTAL] Menggunakan Grid System untuk setiap kategori --- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(categories || []).map(category => (
                  <div
                    key={category.id}
                    className={`
                    rounded-2xl border bg-white p-4 shadow-sm transition-all duration-300 ease-in-out
                    ${category.is_active
                        ? 'border-transparent ring-2 ring-green-500 bg-green-50/40 shadow-green-500/10'
                        : 'border-gray-200/80 hover:border-gray-400 hover:shadow-md'
                      }
                `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`
                                grid h-10 w-10 place-items-center rounded-lg transition-all
                                ${category.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                            }
                            `}
                        >
                          <img
                            src={techStorageSrc(category.icon)}
                            alt={category.name}
                            className="h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-110"
                          />
                        </div>
                        <span className="font-semibold text-gray-800">{category.name}</span>
                      </div>
                      <ToggleSwitch
                        enabled={category.is_active}
                        onChange={(active) => handleCategoryToggle(category.id, active)}
                        loading={loadingCategoryId === category.id}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
            {/* --- [AKHIR STYLE BARU] --- */}

            {/* --- INCOMING JOBS SECTION --- */}
            <section className="reveal" style={{ '--delay': '150ms' }}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Permintaan Masuk</h2>
                <Link href="/teknisi/permintaan" className="text-sm font-semibold hover:underline" style={{ color: PRIMARY }}>Lihat Semua →</Link>
              </div>
              <div className="mt-4 space-y-4">
                {incomingData.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
                    <i className="fas fa-bell-slash fa-2x mx-auto text-gray-400"></i>
                    <p className="mt-4 font-semibold text-gray-800">Tidak Ada Permintaan Baru</p>
                    <p className="mt-1 text-sm text-gray-500">Pastikan status Anda online untuk menerima pekerjaan.</p>
                  </div>
                ) : (
                  incomingData.map((job) => (
                    <div key={job.id} className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:shadow-md">
                      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3"><p className="truncate font-semibold text-gray-900">{job.title}</p><StatusPill status={job.status} /></div>
                          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
                            <span><i className="fas fa-tag fa-xs mr-1.5 text-gray-400" />{job.category}</span>
                            {job.distance_km != null && <span><i className="fas fa-map-marker-alt fa-xs mr-1.5 text-gray-400" />{job.distance_km.toFixed(1)} km</span>}
                            {job.scheduled_for && <span><i className="fas fa-calendar fa-xs mr-1.5 text-gray-400" />{job.scheduled_for}</span>}
                          </p>
                          {job.price_offer && <p className="mt-2 text-sm text-gray-600">Tawaran: <span className="font-bold text-gray-900">{money(job.price_offer)}</span></p>}
                        </div>
                        <div className="flex shrink-0">
                          <Link
                            href={`/teknisi/permintaan/${job.id}`}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.03]"
                            style={{ backgroundColor: '#206BB0' }}
                          >
                            <i className="fas fa-eye text-xs" />
                            <span>Lihat Detail</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* --- SIDEBAR (RIGHT/BOTTOM) --- */}
          <aside className="flex flex-col gap-8 lg:col-span-1">
            <section className="reveal" style={{ '--delay': '250ms' }}>
              <h2 className="text-xl font-bold text-gray-900">Kinerja Hari Ini</h2>
              <div className="mt-4 space-y-3">
                {[
                  { label: "Pekerjaan Baru", value: statsData.today, icon: "fa-calendar-day", color: "text-blue-500" },
                  { label: "Sedang Aktif", value: statsData.in_progress, icon: "fa-tools", color: "text-purple-500" },
                  { label: "Pendapatan", value: money(statsData.revenue_today), icon: "fa-wallet", color: "text-green-500" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-4 rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm">
                    <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg ${s.color.replace('text', 'bg')}/10`}><i className={`fas ${s.icon} fa-lg ${s.color}`} /></div>
                    <div>
                      <p className="text-sm text-gray-600">{s.label}</p>
                      <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="reveal" style={{ '--delay': '350ms' }}>
              <h2 className="text-xl font-bold text-gray-900">Aksi Cepat</h2>
              <div className="mt-4 grid grid-cols-1 gap-3">
                {[
                  { label: "Tarik Tunai", icon: "fa-solid fa-money-bill", href: "/teknisi/withdraw/create" },
                  { label: "Riwayat Pekerjaan", icon: "fa-history", href: "/teknisi/permintaan" },
                  { label: "Bantuan & Panduan", icon: "fa-question-circle", href: "/teknisi/bantuan" },
                ].map((a) => (
                  <Link key={a.label} href={a.href} className="group flex items-center gap-4 rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md hover:bg-blue-50/30">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-gray-100 text-gray-600 transition group-hover:bg-blue-100 group-hover:text-blue-600"><i className={`fas ${a.icon}`} /></div>
                    <span className="font-semibold text-gray-800">{a.label}</span>
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </TechnicianAppLayout>
  );
}