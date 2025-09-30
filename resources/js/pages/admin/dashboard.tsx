import React, { useEffect, useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";

// const ACCENT = "#111827";
const PRIMARY = "#206BB0";

type AdminStats = {
  requests_total: number;
  requests_open: number;
  payments_pending: number;
  payouts_pending: number;
  users_total: number;
  technicians_total: number;
  balance_hold: number;
};

type RecentRequest = {
  id: number;
  user_name: string;
  category: string;
  status: "menunggu" | "diproses" | "dijadwalkan" | "selesai" | "dibatalkan";
  created_at: string;
};

type RecentPayment = {
  id: number;
  request_id: number;
  user_name: string;
  amount: number;
  status: "pending" | "settled" | "failure" | "refunded";
  updated_at: string;
};

type PageProps = {
  auth?: { user?: { name?: string } };
  stats?: Partial<AdminStats>;
  recentRequests?: RecentRequest[];
  recentPayments?: RecentPayment[];
};

function currency(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}
function BadgeReq({ s }: { s: RecentRequest["status"] }) {
  const map: Record<RecentRequest["status"], string> = {
    menunggu: "bg-gray-100 text-gray-700",
    diproses: "bg-blue-50 text-blue-700",
    dijadwalkan: "bg-amber-50 text-amber-700",
    selesai: "bg-green-50 text-green-700",
    dibatalkan: "bg-red-50 text-red-700",
  };
  return <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${map[s]}`}>{s}</span>;
}
function BadgePay({ s }: { s: RecentPayment["status"] }) {
  const map: Record<RecentPayment["status"], string> = {
    pending: "bg-amber-50 text-amber-700",
    settled: "bg-green-50 text-green-700",
    failure: "bg-red-50 text-red-700",
    refunded: "bg-indigo-50 text-indigo-700",
  };
  return <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${map[s]}`}>{s}</span>;
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

export default function AdminDashboard() {
  const page = usePage<PageProps>();
  const { auth, stats, recentRequests, recentPayments } = page.props;
  const currentUrl = page.url || "";

  const [sidebarOpen, setSidebarOpen] = useState(false);       // mobile drawer
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // desktop mini-rail

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSidebarOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Dummy fallback
  const s: AdminStats = {
    requests_total: stats?.requests_total ?? 0,
    requests_open: stats?.requests_open ?? 0,
    payments_pending: stats?.payments_pending ?? 0,
    payouts_pending: stats?.payouts_pending ?? 0,
    users_total: stats?.users_total ?? 0,
    technicians_total: stats?.technicians_total ?? 0,
    balance_hold: stats?.balance_hold ?? 0,
  };

  const reqs: RecentRequest[] = recentRequests ?? [];
  const pays: RecentPayment[] = recentPayments ?? [];
  // const reqs: RecentRequest[] =
  //   recentRequests ?? [
  //     { id: 3012, user_name: "Agus", category: "AC", status: "menunggu", created_at: "2025-09-25 10:21" },
  //     { id: 3011, user_name: "Sari", category: "TV", status: "diproses", created_at: "2025-09-25 09:10" },
  //     { id: 3009, user_name: "Budi", category: "Kulkas", status: "dijadwalkan", created_at: "2025-09-24 16:44" },
  //     { id: 3007, user_name: "Nina", category: "Mesin Cuci", status: "selesai", created_at: "2025-09-24 14:03" },
  //   ];
  // const pays: RecentPayment[] =
  //   recentPayments ?? [
  //     { id: 9007, request_id: 3009, user_name: "Budi", amount: 350000, status: "pending", updated_at: "2025-09-25 10:02" },
  //     { id: 9006, request_id: 3007, user_name: "Nina", amount: 275000, status: "settled", updated_at: "2025-09-24 14:30" },
  //     { id: 9005, request_id: 2998, user_name: "Dewi", amount: 420000, status: "failure", updated_at: "2025-09-24 12:11" },
  //     { id: 9004, request_id: 2995, user_name: "Rizki", amount: 310000, status: "refunded", updated_at: "2025-09-24 10:07" },
  //   ];

  const isActive = (href: string) => currentUrl.startsWith(href);

  // Classes
  const navItemCls = (active: boolean, collapsed: boolean) =>
    [
      "flex items-center rounded-xl px-3 py-2 text-sm font-medium transition",
      active ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-50",
      collapsed ? "justify-center" : "gap-3",
    ].join(" ");

  const sideWidth = sidebarCollapsed ? "md:w-20" : "md:w-72";
  const contentPadLeft = sidebarCollapsed ? "md:pl-20" : "md:pl-72";

  // Brand row: saat collapsed => hanya tombol main menu (tanpa logo/teks)
  const brandRowClass = sidebarCollapsed
    ? "mb-4 flex items-center justify-center"
    : "mb-4 flex items-center justify-between";

  return (
    <>
      <Head title="Dashboard Admin" />
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
            className={[
              "fixed inset-y-0 left-0 z-40 border-r border-gray-100 bg-white transition-transform duration-300",
              "w-72 p-4 md:p-3",
              sideWidth,
              sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            ].join(" ")}
            aria-label="Admin sidebar"
          >
            {/* Brand + Main Menu button */}
            <div className={brandRowClass}>
              {/* Logo hanya saat tidak collapsed */}
              {!sidebarCollapsed && (
                <div className="flex items-center gap-2">
                  <img src="/storage/assets/logo.png" alt="Benerin Indonesia" className="h-8 w-auto" />
                </div>
              )}

              {/* Tombol Main Menu (selalu ada) */}
              <button
                onClick={() => {
                  if (window.innerWidth < 768) setSidebarOpen(false);
                  else setSidebarCollapsed((v) => !v);
                }}
                className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                aria-label="Main Menu"
                aria-expanded={!sidebarCollapsed}
                title="Main Menu"
              >
                {/* collapsed (mini-rail): tampil ikon menu saja */}
                <i className={`fas ${sidebarCollapsed ? "fa-bars" : "fa-chevron-left"}`} />
              </button>
            </div>

            {/* Nav */}
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
              {/* Tombol Logout (POST Inertia) */}
              <Link
                href="/admin/logout"       // ganti ke "/logout" jika pakai route default Laravel
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

              {/* Footer kecil di sidebar */}
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
                  {/* Toggle sidebar (mobile) */}
                  <button
                    className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 md:hidden"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Buka menu"
                  >
                    <i className="fas fa-bars" />
                  </button>

                  <div>
                    <div className="text-xs uppercase tracking-wider text-gray-500">Admin</div>
                    <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="hidden sm:block">
                    <div className="relative">
                      <i className="fas fa-search pointer-events-none absolute left-3 top-2.5 text-sm text-gray-400" />
                      <input
                        type="text"
                        placeholder="Cari…"
                        className="w-56 rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-[var(--acc)]"
                      />
                    </div>
                  </div>
                  <Link
                    href="/"
                    className="hidden items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:flex"
                  >
                    <i className="fas fa-globe-asia" /> Lihat Situs
                  </Link>
                  <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-2.5 py-1.5">
                    <i className="fas fa-user-shield text-gray-500" />
                    <span className="text-sm text-gray-800">{auth?.user?.name ?? "Admin"}</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Main */}
            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {/* KPI */}
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total Requests", value: s.requests_total, icon: "fa-clipboard-list" },
                  { label: "Open (Menunggu/Diproses)", value: s.requests_open, icon: "fa-hourglass-half" },
                  { label: "Payments Pending", value: s.payments_pending, icon: "fa-receipt" },
                  { label: "Payouts Pending", value: s.payouts_pending, icon: "fa-hand-holding-usd" },
                ].map((k) => (
                  <div
                    key={k.label}
                    className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">{k.label}</p>
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-gray-50 text-gray-700">
                        <i className={`fas ${k.icon}`} />
                      </span>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-gray-900">{k.value}</div>
                  </div>
                ))}
              </section>

              {/* Secondary stats */}
              <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Users / Technicians</p>
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-gray-50 text-gray-700">
                      <i className="fas fa-users" />
                    </span>
                  </div>
                  <div className="mt-3 flex items-end gap-6">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{s.users_total}</div>
                      <div className="text-xs text-gray-500">Users</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{s.technicians_total}</div>
                      <div className="text-xs text-gray-500">Technicians</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Total Saldo Tertahan</p>
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-gray-50 text-gray-700">
                      <i className="fas fa-donate" />
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-gray-900">{currency(s.balance_hold)}</div>
                  <p className="mt-1 text-xs text-gray-500">Siap diproses ke payout sesuai kebijakan</p>
                </div>
              </section>

              {/* Tables */}
              <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-gray-900">Permintaan Terbaru</h2>
                    <Link href="/admin/requests" className="text-sm font-semibold hover:underline" style={{ color: PRIMARY }}>
                      Lihat semua →
                    </Link>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="py-2 pr-3">ID</th>
                          <th className="py-2 pr-3">User</th>
                          <th className="py-2 pr-3">Kategori</th>
                          <th className="py-2 pr-3">Status</th>
                          <th className="py-2">Waktu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reqs.map((r) => (
                          <tr key={r.id} className="text-gray-800">
                            <td className="py-2 pr-3 font-medium">
                              <Link href={`/admin/requests/${r.id}`} className="hover:underline">
                                #{r.id}
                              </Link>
                            </td>
                            <td className="py-2 pr-3">{r.user_name}</td>
                            <td className="py-2 pr-3">{r.category}</td>
                            <td className="py-2 pr-3"><BadgeReq s={r.status} /></td>
                            <td className="py-2">{r.created_at}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-gray-900">Pembayaran Terakhir</h2>
                    <Link href="/admin/payments" className="text-sm font-semibold hover:underline" style={{ color: PRIMARY }}>
                      Lihat semua →
                    </Link>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="py-2 pr-3">ID</th>
                          <th className="py-2 pr-3">Request</th>
                          <th className="py-2 pr-3">User</th>
                          <th className="py-2 pr-3">Jumlah</th>
                          <th className="py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {pays.map((p) => (
                          <tr key={p.id} className="text-gray-800">
                            <td className="py-2 pr-3 font-medium">
                              <Link href={`/admin/payments/${p.id}`} className="hover:underline">
                                #{p.id}
                              </Link>
                            </td>
                            <td className="py-2 pr-3">
                              <Link href={`/admin/requests/${p.request_id}`} className="hover:underline">
                                #{p.request_id}
                              </Link>
                            </td>
                            <td className="py-2 pr-3">{p.user_name}</td>
                            <td className="py-2 pr-3">{currency(p.amount)}</td>
                            <td className="py-2"><BadgePay s={p.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Quick actions */}
              <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  { label: "Proses Payout", icon: "fa-hand-holding-usd", href: "/admin/payouts" },
                  { label: "Kelola Users", icon: "fa-user-cog", href: "/admin/users" },
                  { label: "Matrix Layanan Teknisi", icon: "fa-tools", href: "/admin/technician-services" },
                ].map((a) => (
                  <Link
                    key={a.label}
                    href={a.href}
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 text-gray-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-gray-50 text-gray-700">
                      <i className={`fas ${a.icon}`} />
                    </span>
                    <span className="font-medium">{a.label}</span>
                  </Link>
                ))}
              </section>
            </main>

            {/* Footer */}
            <footer className="mt-auto border-t border-gray-100 bg-white/60">
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 text-xs text-gray-500 sm:px-6 lg:px-8">
                <span>© {new Date().getFullYear()} Benerin Indonesia</span>
                <span className="flex items-center gap-2">
                  <i className="fas fa-shield-alt" /> Admin • Versi 1.0
                </span>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </>
  );
}
