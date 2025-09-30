import React, { useEffect, useMemo, useState } from "react";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";

/* =========================================
   Types
========================================= */
type PayoutStatus = "pending" | "paid" | "rejected";

type MiniUser = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
};

type Payout = {
  id: number;
  technician_id: number;
  amount: number | string;
  status: PayoutStatus;
  bank_name?: string | null;
  account_name?: string | null;
  account_number?: string | null;
  paid_at?: string | null;
  note?: string | null;
  created_at?: string | null;

  technician?: MiniUser | null;
};

type Paginated<T> = { data: T[] };

type PageProps = {
  auth?: { user?: { name?: string } };
  payouts?: Paginated<Payout> | Payout[];
  technicians?: MiniUser[];
  filters?: {
    q?: string;
    status?: PayoutStatus | "";
    date_from?: string;
    date_to?: string;
    amount_min?: string;
    amount_max?: string;
    technician_id?: string;
  };
};

/* =========================================
   Helpers
========================================= */
function isPaginatedPayouts(p: PageProps["payouts"]): p is Paginated<Payout> {
  return typeof p === "object" && p !== null && !Array.isArray(p) && Array.isArray((p as Paginated<Payout>).data);
}

function fmtPrice(v?: number | string | null): string {
  const n = typeof v === "string" ? Number(v) : v ?? 0;
  try {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `Rp ${n}`;
  }
}

function fmtDateTime(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function maskRekening(no?: string | null): string {
  if (!no || no.length < 4) return no ?? "-";
  const last = no.slice(-4);
  return `•••• ${last}`;
}

/* =========================================
   UI bits
========================================= */
function PayoutBadge({ status }: { status: PayoutStatus }) {
  const map: Record<PayoutStatus, string> = {
    pending: "bg-amber-50 text-amber-800 border-amber-100",
    paid: "bg-emerald-50 text-emerald-700 border-emerald-100",
    rejected: "bg-rose-50 text-rose-700 border-rose-100",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium ${map[status]}`}>
      <i className="fas fa-wallet" /> {status}
    </span>
  );
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
   Page
========================================= */
export default function AdminPayoutsIndex() {
  const page = usePage<PageProps>();
  const currentUrl = page.url;
  const { payouts, technicians, filters } = page.props;

  // Sidebar & local states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSidebarOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Items
  const items: Payout[] = useMemo(() => {
    if (Array.isArray(payouts)) return payouts;
    if (isPaginatedPayouts(payouts)) return payouts.data;
    // fallback demo
    return [
      {
        id: 5001,
        technician_id: 2,
        amount: 350000,
        status: "paid",
        bank_name: "BCA",
        account_name: "Nina Rahma",
        account_number: "1234567890",
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        technician: { id: 2, name: "Nina Rahma", email: "nina@example.com" },
        note: "Pencairan periode Agustus",
      },
      {
        id: 5002,
        technician_id: 4,
        amount: 210000,
        status: "pending",
        bank_name: "Mandiri",
        account_name: "Doni Prasetyo",
        account_number: "9876543210",
        created_at: new Date().toISOString(),
        technician: { id: 4, name: "Doni Prasetyo", email: "doni@example.com" },
        note: null,
      },
    ];
  }, [payouts]);

  // Filter form
  const filterForm = useForm({
    q: filters?.q ?? "",
    status: (filters?.status ?? "") as string,
    date_from: filters?.date_from ?? "",
    date_to: filters?.date_to ?? "",
    amount_min: filters?.amount_min ?? "",
    amount_max: filters?.amount_max ?? "",
    technician_id: filters?.technician_id ?? "",
  });

  const submitFilter: React.FormEventHandler = (e) => {
    e.preventDefault();
    router.get("/admin/payouts", filterForm.data, { preserveState: true, replace: true });
  };

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

  return (
    <>
      <Head title="Payouts — Admin" />
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Overlay mobile */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px] md:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
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
            {/* Header (selaras dashboard) */}
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
                    <h1 className="text-lg font-semibold text-gray-900">Pencairan Dana</h1>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="hidden sm:block">
                    <div className="relative">
                      <i className="fas fa-search pointer-events-none absolute left-3 top-2.5 text-sm text-gray-400" />
                      <input
                        type="text"
                        placeholder="Cari…"
                        className="w-56 rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-gray-900/20"
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => router.reload({ only: ["payouts"] })}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <i className="fas fa-sync-alt" /> Refresh
                    </button>
                  </div>
                </div>
              </div>
            </header>

            {/* Main */}
            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {/* Filter */}
              <form onSubmit={submitFilter} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
                  <div className="lg:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Cari</label>
                    <div className="relative">
                      <i className="fas fa-search pointer-events-none absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        value={filterForm.data.q}
                        onChange={(e) => filterForm.setData("q", e.target.value)}
                        placeholder="ID/Nama/Email/Bank…"
                        className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
                    <select
                      value={filterForm.data.status}
                      onChange={(e) => filterForm.setData("status", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                    >
                      <option value="">Semua</option>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Dari Tanggal</label>
                    <input
                      type="date"
                      value={filterForm.data.date_from}
                      onChange={(e) => filterForm.setData("date_from", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Sampai</label>
                    <input
                      type="date"
                      value={filterForm.data.date_to}
                      onChange={(e) => filterForm.setData("date_to", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Teknisi</label>
                    <select
                      value={filterForm.data.technician_id}
                      onChange={(e) => filterForm.setData("technician_id", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                    >
                      <option value="">Semua</option>
                      {(technicians ?? []).map((t) => (
                        <option key={t.id} value={String(t.id)}>
                          {t.name} — {t.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-6">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Min Amount</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={filterForm.data.amount_min}
                      onChange={(e) => filterForm.setData("amount_min", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Max Amount</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={filterForm.data.amount_max}
                      onChange={(e) => filterForm.setData("amount_max", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                      placeholder="1000000"
                    />
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                  >
                    <i className="fas fa-filter" /> Terapkan
                  </button>
                  <Link
                    href="/admin/payouts"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                    preserveState
                    replace
                  >
                    <i className="fas fa-undo" /> Reset
                  </Link>
                </div>
              </form>

              {/* Table */}
              <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="py-2 pr-3">ID</th>
                        <th className="py-2 pr-3">Dibuat</th>
                        <th className="py-2 pr-3">Dibayar</th>
                        <th className="py-2 pr-3">Teknisi</th>
                        <th className="py-2 pr-3">Jumlah</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2 pr-3">Rekening</th>
                        <th className="py-2 pr-3">Catatan</th>
                        <th className="py-2 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((p) => (
                        <tr key={p.id} className="text-gray-800">
                          <td className="py-2 pr-3 font-semibold">#{p.id}</td>
                          <td className="py-2 pr-3">{fmtDateTime(p.created_at)}</td>
                          <td className="py-2 pr-3">{fmtDateTime(p.paid_at)}</td>
                          <td className="py-2 pr-3">
                            {p.technician ? (
                              <>
                                <div className="font-medium">{p.technician.name}</div>
                                <div className="text-xs text-gray-500">{p.technician.email}</div>
                              </>
                            ) : (
                              <span className="text-gray-400">ID: {p.technician_id}</span>
                            )}
                          </td>
                          <td className="py-2 pr-3">{fmtPrice(p.amount)}</td>
                          <td className="py-2 pr-3">
                            <PayoutBadge status={p.status} />
                          </td>
                          <td className="py-2 pr-3">
                            <div className="text-xs text-gray-600">{p.bank_name ?? "-"}</div>
                            <div className="font-mono text-[11px] text-gray-800">{maskRekening(p.account_number)}</div>
                            <div className="text-[11px] text-gray-500">{p.account_name ?? "-"}</div>
                          </td>
                          <td className="py-2 pr-3">
                            <div className="line-clamp-2 max-w-[220px] text-xs text-gray-600">{p.note ?? "-"}</div>
                          </td>
                          <td className="py-2">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/admin/payouts/${p.id}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                              >
                                <i className="fas fa-eye" /> Lihat
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {items.length === 0 && (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-sm text-gray-500">
                            Tidak ada data.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
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
