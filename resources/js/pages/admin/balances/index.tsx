import React, { useEffect, useMemo, useState } from "react";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";

/* =========================================
   Types
========================================= */
type OwnerRole = "user" | "teknisi";
type LedgerType =
  | "hold"
  | "payout"
  | "adjustment"
  | "refund_credit"
  | "refund_reversal"
  | "payment_debit";

type OwnerRow = {
  id: number;
  role: OwnerRole;
  name: string;
  email: string;
  totalCredit: number;
  totalDebit: number;
  balance: number;
  entriesCount?: number;
};

type Paginated<T> = { data: T[] };

type PageProps = {
  auth?: { user?: { name?: string } };
  // balances?: Paginated<BalanceEntry> | BalanceEntry[]; // tidak dipakai di tabel index ini
  owners?: Paginated<OwnerRow> | OwnerRow[];
  filters?: {
    q?: string;
    owner_role?: OwnerRole | "";
    type?: LedgerType | "";
    date_from?: string;
    date_to?: string;
    amount_min?: string;
    amount_max?: string;
    owner_id?: string;
    ref_table?: string;
    ref_id?: string;
  };
  totals?: {
    total_users: number;
    total_all_balance: number;
    total_credit: number;
    total_debit: number;
  };
};

/* =========================================
   Helpers
========================================= */
function fmtPrice(v?: number | string | null): string {
  const n = typeof v === "string" ? Number(v) : v ?? 0;
  try {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `Rp ${n}`;
  }
}

/* =========================================
   UI bits
========================================= */
function RoleBadge({ role }: { role: OwnerRole }) {
  const cls =
    role === "teknisi"
      ? "bg-indigo-50 text-indigo-700 border-indigo-100"
      : "bg-sky-50 text-sky-700 border-sky-100";
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium ${cls}`}>
      <i className={`fas ${role === "teknisi" ? "fa-tools" : "fa-user"}`} /> {role}
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
export default function AdminBalancesIndex() {
  const page = usePage<PageProps>();
  const currentUrl = page.url;
  const { auth, owners, filters, totals } = page.props;

  // Sidebar & local states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSidebarOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // === Sumber data untuk tabel: owners dari backend (sudah teragregasi)
  const grouped: OwnerRow[] = useMemo(() => {
    if (!owners) return [];
    if (Array.isArray(owners)) return owners;
    return owners.data ?? [];
  }, [owners]);

  // Ringkasan (pakai totals dari backend jika ada; fallback hitung lokal)
  const totalUsers = totals?.total_users ?? grouped.length;
  const totalAllBalance =
    totals?.total_all_balance ??
    grouped.reduce((s, g) => s + (Number.isFinite(g.balance) ? g.balance : 0), 0);
  const totalCredit =
    totals?.total_credit ??
    grouped.reduce((s, g) => s + (Number.isFinite(g.totalCredit) ? g.totalCredit : 0), 0);
  const totalDebit =
    totals?.total_debit ??
    grouped.reduce((s, g) => s + (Number.isFinite(g.totalDebit) ? g.totalDebit : 0), 0);

  // Filter form
  const filterForm = useForm({
    q: filters?.q ?? "",
    owner_role: (filters?.owner_role ?? "") as string,
    type: (filters?.type ?? "") as string,
    date_from: filters?.date_from ?? "",
    date_to: filters?.date_to ?? "",
    amount_min: filters?.amount_min ?? "",
    amount_max: filters?.amount_max ?? "",
    owner_id: filters?.owner_id ?? "",
    ref_table: filters?.ref_table ?? "",
    ref_id: filters?.ref_id ?? "",
  });

  const submitFilter: React.FormEventHandler = (e) => {
    e.preventDefault();
    router.get("/admin/balances", filterForm.data, { preserveState: true, replace: true });
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

  const [refreshing, setRefreshing] = useState(false);

  const doRefresh = () => {
    setRefreshing(true);
    router.reload({
      only: ["owners", "filters", "totals"],
      onFinish: () => setRefreshing(false),
      onError: () => setRefreshing(false),
    });
  };

  return (
    <>
      <Head title="Saldo" />
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Overlay mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px] md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden
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
              {/* Tombol Logout (POST Inertia) */}
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
                  <button
                    className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 md:hidden"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Buka menu"
                  >
                    <i className="fas fa-bars" />
                  </button>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-gray-500">Admin</div>
                    <h1 className="text-lg font-semibold text-gray-900">Saldo</h1>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={doRefresh}
                      disabled={refreshing}
                      aria-busy={refreshing}
                      className={[
                        "inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2",
                        "text-sm font-semibold text-gray-700 hover:bg-gray-50",
                        refreshing ? "opacity-60 cursor-not-allowed" : ""
                      ].join(" ")}
                      title="Muat ulang data saldo"
                    >
                      <i className={["fas", "fa-sync-alt", refreshing ? "animate-spin" : ""].join(" ")} />
                      {refreshing ? "Menyegarkan…" : "Refresh"}
                    </button>
                  </div>

                  <div className="hidden items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-2.5 py-1.5 sm:flex">
                    <i className="fas fa-user-shield text-gray-500" />
                    <span className="text-sm text-gray-800">{auth?.user?.name ?? "Admin"}</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Main */}
            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {/* Summary */}
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="text-xs text-gray-500">Total Kredit (≥ 0)</div>
                  <div className="mt-0.5 text-lg font-semibold text-emerald-700">{fmtPrice(totalCredit)}</div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="text-xs text-gray-500">Total Debit (&lt; 0)</div>
                  <div className="mt-0.5 text-lg font-semibold text-rose-600">{fmtPrice(totalDebit)}</div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="text-xs text-gray-500">Saldo Akhir Seluruh Pengguna</div>
                  <div className={`mt-0.5 text-lg font-semibold ${totalAllBalance >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                    {fmtPrice(totalAllBalance)} <span className="ml-2 text-xs text-gray-500">({totalUsers} pengguna)</span>
                  </div>
                </div>
              </div>

              {/* Filter */}
              <form onSubmit={submitFilter} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
                  {/* Search */}
                  <div className="lg:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Cari</label>
                    <div className="relative">
                      <i className="fas fa-search pointer-events-none absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        value={filterForm.data.q}
                        onChange={(e) => filterForm.setData("q", e.target.value)}
                        placeholder="Nama / Email / Catatan..."
                        className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                      />
                    </div>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Role</label>
                    <select
                      value={filterForm.data.owner_role}
                      onChange={(e) => filterForm.setData("owner_role", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                    >
                      <option value="">Semua</option>
                      <option value="user">User</option>
                      <option value="teknisi">Teknisi</option>
                    </select>
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
                    href="/admin/balances"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                    preserveState
                    replace
                  >
                    <i className="fas fa-undo" /> Reset
                  </Link>
                </div>
              </form>

              {/* Table saldo per pengguna */}
              <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="py-2 pr-3">#</th>
                        <th className="py-2 pr-3">Role</th>
                        <th className="py-2 pr-3">Nama</th>
                        <th className="py-2 pr-3">Email</th>
                        <th className="py-2 pr-3 text-right">Total Kredit</th>
                        <th className="py-2 pr-3 text-right">Total Debit</th>
                        <th className="py-2 pr-3 text-right">Saldo Akhir</th>
                        <th className="py-2 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {grouped.map((g, i) => (
                        <tr key={`${g.role}-${g.id}`} className="text-gray-800">
                          <td className="py-2 pr-3">{i + 1}</td>
                          <td className="py-2 pr-3"><RoleBadge role={g.role} /></td>
                          <td className="py-2 pr-3 font-medium">{g.name}</td>
                          <td className="py-2 pr-3 text-xs text-gray-500">{g.email}</td>
                          <td className="py-2 pr-3 text-right text-emerald-700 font-semibold">{fmtPrice(g.totalCredit)}</td>
                          <td className="py-2 pr-3 text-right text-rose-600 font-semibold">{fmtPrice(g.totalDebit)}</td>
                          <td className={`py-2 pr-3 text-right font-semibold ${g.balance >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                            {fmtPrice(g.balance)}
                          </td>
                          <td className="py-2 text-center">
                            <Link
                              href={`/admin/balances/${g.role}/${g.id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                              <i className="fas fa-eye" /> Lihat Detail
                            </Link>
                          </td>
                        </tr>
                      ))}

                      {grouped.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-sm text-gray-500">
                            Tidak ada data saldo pengguna.
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
