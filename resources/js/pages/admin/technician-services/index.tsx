import React, { useEffect, useMemo, useState } from "react";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";

/* =========================================
   Types
========================================= */
type UserLite = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  // backend bisa menambahkan role jika perlu; di UI ini kita asumsi daftar yang diterima adalah teknisi
};

type TechnicianService = {
  id: number;
  technician_id: number;
  category: string; // slug category
  active: boolean;
};

type Category = {
  slug: string;
  name: string;
};

type PaginationLink = { url: string | null; label: string; active: boolean };

type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links?: PaginationLink[];
};

type PageProps = {
  auth?: { user?: { name?: string } };
  // opsional: services dipakai untuk menghitung jumlah layanan aktif per teknisi
  services?: TechnicianService[] | Paginated<TechnicianService>;
  // WAJIB: semua teknisi (idealnya role=teknisi) dari tabel users
  technicians?: UserLite[] | Paginated<UserLite>;
  categories?: Category[];
};

/* =========================================
   Helpers
========================================= */
function isPaginatedServices(s: PageProps["services"]): s is Paginated<TechnicianService> {
  return typeof s === "object" && s !== null && !Array.isArray(s) && Array.isArray((s as Paginated<TechnicianService>).data);
}
function isPaginatedTechnicians(t: PageProps["technicians"]): t is Paginated<UserLite> {
  return typeof t === "object" && t !== null && !Array.isArray(t) && Array.isArray((t as Paginated<UserLite>).data);
}

const NAV = [
  { href: "/admin/dashboard", icon: "fa-tachometer-alt", label: "Dashboard" },
  { href: "/admin/requests", icon: "fa-clipboard-list", label: "Permintaan Servis" },
  { href: "/admin/payments", icon: "fa-receipt", label: "Pembayaran" },
  { href: "/admin/payouts", icon: "fa-hand-holding-usd", label: "Pencairan Dana" },
  { href: "/admin/balances", icon: "fa-balance-scale", label: "Saldo" },
  { href: "/admin/users", icon: "fa-users", label: "Users" },
  { href: "/admin/technician-services", icon: "fa-tools", label: "Layanan Teknisi" },
  { href: "/admin/categories", icon: "fa-tags", label: "Kategori" },
];

/* =========================================
   Small UI
========================================= */
function RoleBadgeTech() {
  return <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">Teknisi</span>;
}

/* =========================================
   PAGE: Layanan Service (Index teknisi)
========================================= */
export default function AdminTechnicianServicesIndex() {
  const page = usePage<PageProps>();
  const currentUrl = page.url;
  const { auth } = page.props;

  // Sidebar states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ESC close sidebar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSidebarOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Ambil technicians
  const allTechnicians: UserLite[] = useMemo(() => {
    if (Array.isArray(page.props.technicians)) return page.props.technicians;
    if (isPaginatedTechnicians(page.props.technicians)) return page.props.technicians.data;
    // fallback sample jika props kosong
    return [
      { id: 2, name: "Nina Rahma", email: "nina@example.com", phone: "0812-3456-7890" },
      { id: 5, name: "Budi Santoso", email: "budi@example.com", phone: "0813-9876-5432" },
    ];
  }, [page.props.technicians]);

  // Ambil services (untuk hitung jumlah layanan aktif per teknisi)
  const allServices: TechnicianService[] = useMemo(() => {
    if (Array.isArray(page.props.services)) return page.props.services;
    if (isPaginatedServices(page.props.services)) return page.props.services.data;
    // fallback sample
    return [
      { id: 1, technician_id: 2, category: "ac", active: true },
      { id: 2, technician_id: 2, category: "tv", active: false },
      { id: 3, technician_id: 5, category: "kulkas", active: true },
      { id: 4, technician_id: 5, category: "mesin-cuci", active: true },
    ];
  }, [page.props.services]);

  // Mapping: technicianId -> jumlah layanan aktif
  const activeCountByTech = useMemo(() => {
    const map = new Map<number, number>();
    for (const s of allServices) {
      if (s.active) map.set(s.technician_id, (map.get(s.technician_id) ?? 0) + 1);
    }
    return map;
  }, [allServices]);

  const filterForm = useForm({ q: "" });

  const submitFilter: React.FormEventHandler = (e) => {
    e.preventDefault();
  };

  const filteredTechnicians = useMemo(() => {
    const q = (filterForm.data.q ?? "").toLowerCase().trim();
    if (!q) return allTechnicians;
    return allTechnicians.filter((t) => {
      const hay = `${t.name ?? ""} ${t.email ?? ""} ${t.phone ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [allTechnicians, filterForm.data.q]);

  // Helpers
  const isActive = (href: string) => currentUrl.startsWith(href);
  const navItemCls = (active: boolean, collapsed: boolean) =>
    [
      "flex items-center rounded-xl px-3 py-2 text-sm font-medium transition",
      active ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-50",
      collapsed ? "justify-center" : "gap-3",
    ].join(" ");
  const sideWidth = sidebarCollapsed ? "md:w-20" : "md:w-72";
  const contentPadLeft = sidebarCollapsed ? "md:pl-20" : "md:pl-72";

  const [refreshing, setRefreshing] = useState(false);
  const doRefresh = () => {
    setRefreshing(true);
    router.reload({
      only: ["technicians", "services"],
      onFinish: () => setRefreshing(false),
      onError: () => setRefreshing(false),
    });
  };

  return (
    <>
      <Head title="Layanan Service" />
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Overlay mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px] md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Sidebar */}
          <aside
            aria-label="Admin sidebar"
            className={[
              "fixed inset-y-0 left-0 z-40 border-r border-gray-100 bg-white transition-transform duration-300",
              "w-72 p-4 md:p-3",
              sideWidth,
              sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            ].join(" ")}
          >
            <div className={sidebarCollapsed ? "mb-4 flex items-center justify-center" : "mb-4 flex items-center justify-between"}>
              {!sidebarCollapsed && (
                <div className="flex items-center gap-2">
                  <img src="/storage/assets/logo.png" alt="Benerin Indonesia" className="h-8 w-auto" />
                </div>
              )}
              <button
                onClick={() => {
                  if (window.innerWidth < 768) setSidebarOpen(false);
                  else setSidebarCollapsed((v) => !v);
                }}
                className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                aria-label="Main Menu"
                title="Main Menu"
              >
                <i className={`fas ${sidebarCollapsed ? "fa-bars" : "fa-chevron-left"}`} />
              </button>
            </div>

            <nav className="space-y-1">
              {NAV.map((it) => {
                const active = isActive(it.href);
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={navItemCls(active, sidebarCollapsed)}
                    title={sidebarCollapsed ? it.label : undefined}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-gray-50 text-gray-700">
                      <i className={`fas ${it.icon}`} />
                    </span>
                    {!sidebarCollapsed && <span>{it.label}</span>}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto">
              {/* Logout (POST) */}
              <Link
                href="/admin/logout"
                method="post"
                as="button"
                className={[
                  "mt-4 w-full",
                  "flex items-center rounded-xl px-3 py-2 text-sm font-semibold transition",
                  "border border-red-100 text-red-700 hover:bg-red-50",
                  sidebarCollapsed ? "justify-center" : "gap-3",
                ].join(" ")}
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-600">
                  <i className="fas fa-sign-out-alt" />
                </span>
                {!sidebarCollapsed && <span>Logout</span>}
              </Link>

              <div className="mt-4 border-t border-gray-100 pt-4 text-center text-xs text-gray-500">
                {!sidebarCollapsed && <>© {new Date().getFullYear()} Benerin Indonesia</>}
                {sidebarCollapsed && <span className="block text-[10px]">© {new Date().getFullYear()}</span>}
              </div>
            </div>
          </aside>

          {/* Content */}
          <div className={`flex min-h-screen w-full flex-col ${contentPadLeft}`}>
            {/* Header */}
            <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/70 backdrop-blur">
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2">
                  <button
                    className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 md:hidden"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Buka menu"
                  >
                    <i className="fas fa-bars" />
                  </button>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-gray-500">Admin</div>
                    <h1 className="text-lg font-semibold text-gray-900">Layanan Service</h1>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={doRefresh}
                    disabled={refreshing}
                    aria-busy={refreshing}
                    className={[
                      "inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2",
                      "text-sm font-semibold text-gray-700 hover:bg-gray-50",
                      refreshing ? "opacity-60 cursor-not-allowed" : "",
                    ].join(" ")}
                    title="Muat ulang data"
                  >
                    <i className={["fas", "fa-sync-alt", refreshing ? "animate-spin" : ""].join(" ")} />
                    {refreshing ? "Menyegarkan…" : "Refresh"}
                  </button>

                  <div className="hidden items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-2.5 py-1.5 sm:flex">
                    <i className="fas fa-user-shield text-gray-500" />
                    <span className="text-sm text-gray-800">{auth?.user?.name ?? "Admin"}</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Main */}
            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {/* FILTER */}
              <form onSubmit={submitFilter} className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Cari teknisi</label>
                    <div className="relative">
                      <i className="fas fa-search pointer-events-none absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        value={filterForm.data.q}
                        onChange={(e) => filterForm.setData("q", e.target.value)}
                        placeholder="Nama / email / no HP…"
                        className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                  >
                    <i className="fas fa-filter" /> Terapkan
                  </button>
                  <Link
                    href="/admin/users"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                    preserveState
                    replace
                  >
                    <i className="fas fa-undo" /> Reset
                  </Link>
                </div>
              </form>

              {/* TABLE */}
              <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="py-2 pr-3 w-16">No</th>
                        <th className="py-2 pr-3">Nama Teknisi</th>
                        <th className="py-2 pr-3">Email</th>
                        <th className="py-2 pr-3">No HP</th>
                        <th className="py-2 pr-3">Jumlah Layanan Dibuka</th>
                        <th className="py-2 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredTechnicians.map((t, idx) => (
                        <tr key={t.id} className="text-gray-800">
                          <td className="py-2 pr-3">{idx + 1}</td>
                          <td className="py-2 pr-3 font-medium">
                            <div className="flex items-center gap-2">
                              <span>{t.name}</span>
                              <RoleBadgeTech />
                            </div>
                          </td>
                          <td className="py-2 pr-3">{t.email}</td>
                          <td className="py-2 pr-3">{t.phone ?? "-"}</td>
                          <td className="py-2 pr-3 text-emerald-700 font-medium">
                            {activeCountByTech.get(t.id) ?? 0}
                          </td>
                          <td className="py-2 text-right">
                            <Link
                              href={`/admin/technician-services/${t.id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              <i className="fas fa-eye" /> Lihat
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </main>

            {/* Footer */}
            <footer className="mt-auto border-t border-gray-100 bg-white/60">
              <div className="mx-auto max-w-7xl px-4 py-3 text-xs text-gray-500 sm:px-6 lg:px-8">
                © {new Date().getFullYear()} Benerin Indonesia
              </div>
            </footer>
          </div>
        </div>
      </div>
    </>
  );
}
