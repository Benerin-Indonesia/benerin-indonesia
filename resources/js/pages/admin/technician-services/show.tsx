import React, { useEffect, useMemo, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";

/* =========================================
   Types
========================================= */
type UserLite = { id: number; name: string; email: string; phone?: string | null };
type TechnicianService = { id: number; technician_id: number; category: string; active: boolean };
type Category = { slug: string; name: string; icon?: string | null };
type PageProps = {
  auth?: { user?: { name?: string } };
  owner: UserLite;
  services: TechnicianService[];
  categories: Category[];
};

/* =========================================
   NAV (samakan isi & urutan)
========================================= */
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

/* Badge */
function RoleBadge() {
  return (
    <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
      Teknisi
    </span>
  );
}

/* Toggle Switch */
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
        checked ? "bg-emerald-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

/* =========================================
   PAGE
========================================= */
export default function TechnicianServiceShow() {
  const page = usePage<PageProps>();
  const { owner, services, categories, auth } = page.props;
  const currentUrl = page.url;

  // Sidebar state & behavior — disamakan
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSidebarOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const sideWidth = sidebarCollapsed ? "md:w-20" : "md:w-72";
  const contentPadLeft = sidebarCollapsed ? "md:pl-20" : "md:pl-72";

  const isActive = (href: string) => currentUrl.startsWith(href);
  const navItemCls = (active: boolean, collapsed: boolean) =>
    [
      "flex items-center rounded-xl px-3 py-2 text-sm font-medium transition",
      active ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-50",
      collapsed ? "justify-center" : "gap-3",
    ].join(" ");

  /* Map layanan berdasarkan kategori */
  const servicesMap = useMemo(() => {
    const map = new Map<string, TechnicianService>();
    services.forEach((s) => map.set(s.category, s));
    return map;
  }, [services]);

  const toggleService = (slug: string) => {
    router.post(
      `/admin/technician-services/${owner.id}/toggle`,
      { category: slug },
      { preserveScroll: true }
    );
  };

  return (
    <>
      <Head title={`Layanan Teknisi — ${owner.name}`} />

      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Overlay mobile — disamakan */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px] md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden
            />
          )}

          {/* SIDEBAR — style & isi disamakan */}
          <aside
            aria-label="Admin sidebar"
            className={[
              "fixed inset-y-0 left-0 z-40 border-r border-gray-100 bg-white transition-transform duration-300",
              "w-72 p-4 md:p-3",
              sideWidth,
              sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            ].join(" ")}
          >
            <div
              className={
                sidebarCollapsed
                  ? "mb-4 flex items-center justify-center"
                  : "mb-4 flex items-center justify-between"
              }
            >
              {!sidebarCollapsed && (
                <div className="flex items-center gap-2">
                  <img
                    src="/storage/assets/logo.png"
                    alt="Benerin Indonesia"
                    className="h-8 w-auto"
                  />
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
              {/* Tombol Logout — disamakan */}
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

              {/* Copyright — disamakan */}
              <div className="mt-4 border-t border-gray-100 pt-4 text-center text-xs text-gray-500">
                {!sidebarCollapsed && <>© {new Date().getFullYear()} Benerin Indonesia</>}
                {sidebarCollapsed && (
                  <span className="block text-[10px]">© {new Date().getFullYear()}</span>
                )}
              </div>
            </div>
          </aside>

          {/* CONTENT */}
          <div className={`flex min-h-screen w-full flex-col ${contentPadLeft}`}>
            {/* HEADER — diseragamkan */}
            <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/70 backdrop-blur">
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3">
                  <button
                    className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 md:hidden"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Buka menu"
                  >
                    <i className="fas fa-bars" />
                  </button>
                  <Link
                    href="/admin/technician-services"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <i className="fas fa-arrow-left" /> Kembali
                  </Link>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-gray-500">Admin</div>
                    <h1 className="text-lg font-semibold text-gray-900">
                      Detail Layanan Teknisi
                    </h1>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-2.5 py-1.5">
                    <i className="fas fa-user-shield text-gray-500" />
                    <span className="text-sm text-gray-800">
                      {auth?.user?.name ?? "Admin"}
                    </span>
                  </div>
                </div>
              </div>
            </header>

            {/* MAIN */}
            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
              {/* Profil teknisi */}
              <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <h2 className="text-base font-semibold mb-3 text-gray-900">Profil Teknisi</h2>
                <div className="grid sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">Nama</div>
                    <div className="font-medium flex gap-2 text-gray-900">
                      {owner.name} <RoleBadge />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Email</div>
                    <div className="text-gray-800">{owner.email}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Telepon</div>
                    <div className="text-gray-800">{owner.phone ?? "-"}</div>
                  </div>
                </div>
              </section>

              {/* Grid Card Layanan */}
              <h2 className="text-base font-semibold text-gray-900">Layanan yang Tersedia</h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map((c) => {
                  const active = servicesMap.get(c.slug)?.active ?? false;
                  return (
                    <div
                      key={c.slug}
                      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex flex-col items-center text-center gap-3"
                    >
                      <img
                        src={c.icon ? `/storage/${c.icon}` : "/storage/assets/default.png"}
                        className="h-14 object-contain"
                        alt={c.name}
                      />
                      <div className="font-medium text-gray-900">{c.name}</div>
                      <Toggle checked={active} onChange={() => toggleService(c.slug)} />
                    </div>
                  );
                })}
              </div>
            </main>

            {/* FOOTER — disamakan */}
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
