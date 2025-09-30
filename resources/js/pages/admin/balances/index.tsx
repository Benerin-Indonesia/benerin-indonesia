import React, { useEffect, useMemo, useState } from "react";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";

/* =========================================
   Types
========================================= */
type OwnerRole = "user" | "technician";
type LedgerType =
  | "hold"
  | "payout"
  | "adjustment"
  | "refund_credit"
  | "refund_reversal"
  | "payment_debit";

type MiniOwner = {
  id: number;
  role: OwnerRole;
  name: string;
  email: string;
  phone?: string | null;
};

type BalanceEntry = {
  id: number;
  owner_role: OwnerRole;
  owner_id: number;
  amount: number | string; // bisa negatif
  currency: string; // IDR
  type: LedgerType;
  ref_table?: string | null;
  ref_id?: number | null;
  note?: string | null;
  created_at?: string | null;

  owner?: MiniOwner | null; // optional (kalau backend ikut kirim)
};

type Paginated<T> = { data: T[] };

type PageProps = {
  auth?: { user?: { name?: string } };
  balances?: Paginated<BalanceEntry> | BalanceEntry[];
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
};

/* =========================================
   Helpers
========================================= */
function isPaginatedBalances(b: PageProps["balances"]): b is Paginated<BalanceEntry> {
  return typeof b === "object" && b !== null && !Array.isArray(b) && Array.isArray((b as Paginated<BalanceEntry>).data);
}

function toNumber(n: number | string | undefined | null): number {
  if (n == null) return 0;
  return typeof n === "string" ? Number(n) : n;
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
  if (Number.isNaN(d.getTime())) return iso ?? "-";
  return d.toLocaleString("id-ID", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* =========================================
   UI bits
========================================= */
function RoleBadge({ role }: { role: OwnerRole }) {
  const cls =
    role === "technician"
      ? "bg-indigo-50 text-indigo-700 border-indigo-100"
      : "bg-sky-50 text-sky-700 border-sky-100";
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium ${cls}`}>
      <i className={`fas ${role === "technician" ? "fa-tools" : "fa-user"}`} /> {role}
    </span>
  );
}

function TypeBadge({ type }: { type: LedgerType }) {
  const map: Record<LedgerType, string> = {
    hold: "bg-amber-50 text-amber-800 border-amber-100",
    payout: "bg-rose-50 text-rose-700 border-rose-100",
    adjustment: "bg-gray-100 text-gray-700 border-gray-200",
    refund_credit: "bg-emerald-50 text-emerald-700 border-emerald-100",
    refund_reversal: "bg-rose-50 text-rose-700 border-rose-100",
    payment_debit: "bg-rose-50 text-rose-700 border-rose-100",
  };
  const icon: Record<LedgerType, string> = {
    hold: "fa-pause-circle",
    payout: "fa-wallet",
    adjustment: "fa-sliders-h",
    refund_credit: "fa-undo",
    refund_reversal: "fa-redo",
    payment_debit: "fa-credit-card",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium ${map[type]}`}>
      <i className={`fas ${icon[type]}`} /> {type}
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
  const { auth, balances, filters } = page.props;

  // Sidebar & local states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSidebarOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Items
  const items: BalanceEntry[] = useMemo(() => {
    if (Array.isArray(balances)) return balances;
    if (isPaginatedBalances(balances)) return balances.data;
    // fallback demo agar layout langsung terlihat
    return [
      {
        id: 1,
        owner_role: "technician",
        owner_id: 2,
        amount: 250000,
        currency: "IDR",
        type: "hold",
        ref_table: "payments",
        ref_id: 9001,
        note: "Hold setelah pembayaran settled",
        created_at: new Date().toISOString(),
        owner: { id: 2, role: "technician", name: "Nina Rahma", email: "nina@example.com" },
      },
      {
        id: 2,
        owner_role: "technician",
        owner_id: 2,
        amount: -250000,
        currency: "IDR",
        type: "payout",
        ref_table: "payouts",
        ref_id: 5001,
        note: "Pencairan saldo",
        created_at: new Date().toISOString(),
        owner: { id: 2, role: "technician", name: "Nina Rahma", email: "nina@example.com" },
      },
      {
        id: 3,
        owner_role: "user",
        owner_id: 11,
        amount: 150000,
        currency: "IDR",
        type: "refund_credit",
        ref_table: "refunds",
        ref_id: 7001,
        note: "Pengembalian dana parsial",
        created_at: new Date().toISOString(),
        owner: { id: 11, role: "user", name: "Agus Saputra", email: "agus@example.com" },
      },
      {
        id: 4,
        owner_role: "user",
        owner_id: 11,
        amount: -100000,
        currency: "IDR",
        type: "payment_debit",
        ref_table: "payments",
        ref_id: 9003,
        note: "Pembayaran menggunakan wallet",
        created_at: new Date().toISOString(),
        owner: { id: 11, role: "user", name: "Agus Saputra", email: "agus@example.com" },
      },
    ];
  }, [balances]);

  // Ringkasan total kredit/debit dari items yang tampil
  const { totalCredit, totalDebit } = useMemo(() => {
    let credit = 0;
    let debit = 0;
    for (const it of items) {
      const n = toNumber(it.amount);
      if (n >= 0) credit += n;
      else debit += n;
    }
    return { totalCredit: credit, totalDebit: debit };
  }, [items]);

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

  return (
    <>
      <Head title="Balances — Admin" />
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
                  <button
                    type="button"
                    onClick={() => router.reload({ only: ["balances"] })}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <i className="fas fa-sync-alt" /> Refresh
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
              {/* Summary */}
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="text-xs text-gray-500">Total Kredit (≥ 0)</div>
                  <div className="mt-0.5 text-lg font-semibold text-emerald-700">{fmtPrice(totalCredit)}</div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="text-xs text-gray-500">Total Debit (&lt; 0)</div>
                  <div className="mt-0.5 text-lg font-semibold text-rose-600">{fmtPrice(totalDebit)}</div>
                </div>
              </div>

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
                        placeholder="ID/Owner/Nama/Email/Ref/Note…"
                        className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Role</label>
                    <select
                      value={filterForm.data.owner_role}
                      onChange={(e) => filterForm.setData("owner_role", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                    >
                      <option value="">Semua</option>
                      <option value="user">User</option>
                      <option value="technician">Technician</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Type</label>
                    <select
                      value={filterForm.data.type}
                      onChange={(e) => filterForm.setData("type", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                    >
                      <option value="">Semua</option>
                      <option value="hold">hold</option>
                      <option value="payout">payout</option>
                      <option value="adjustment">adjustment</option>
                      <option value="refund_credit">refund_credit</option>
                      <option value="refund_reversal">refund_reversal</option>
                      <option value="payment_debit">payment_debit</option>
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
                    <label className="mb-1 block text-xs font-medium text-gray-600">Owner ID</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={filterForm.data.owner_id}
                      onChange={(e) => filterForm.setData("owner_id", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                      placeholder="mis. 2"
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-6">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Ref Table</label>
                    <input
                      type="text"
                      value={filterForm.data.ref_table}
                      onChange={(e) => filterForm.setData("ref_table", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                      placeholder="payments / payouts / refunds …"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Ref ID</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={filterForm.data.ref_id}
                      onChange={(e) => filterForm.setData("ref_id", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                      placeholder="mis. 9001"
                    />
                  </div>
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
                    href="/admin/balances"
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
                        <th className="py-2 pr-3">Waktu</th>
                        <th className="py-2 pr-3">Role</th>
                        <th className="py-2 pr-3">Owner</th>
                        <th className="py-2 pr-3">Type</th>
                        <th className="py-2 pr-3">Amount</th>
                        <th className="py-2 pr-3">Currency</th>
                        <th className="py-2 pr-3">Ref</th>
                        <th className="py-2">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((b) => {
                        const amt = toNumber(b.amount);
                        const amountClass = amt < 0 ? "text-rose-600" : "text-emerald-700";
                        return (
                          <tr key={b.id} className="text-gray-800">
                            <td className="py-2 pr-3 font-semibold">#{b.id}</td>
                            <td className="py-2 pr-3">{fmtDateTime(b.created_at)}</td>
                            <td className="py-2 pr-3">
                              <RoleBadge role={b.owner_role} />
                            </td>
                            <td className="py-2 pr-3">
                              {b.owner ? (
                                <>
                                  <div className="font-medium">{b.owner.name}</div>
                                  <div className="text-xs text-gray-500">{b.owner.email}</div>
                                </>
                              ) : (
                                <span className="text-gray-400">
                                  {b.owner_role} #{b.owner_id}
                                </span>
                              )}
                            </td>
                            <td className="py-2 pr-3">
                              <TypeBadge type={b.type} />
                            </td>
                            <td className={`py-2 pr-3 font-semibold ${amountClass}`}>{fmtPrice(b.amount)}</td>
                            <td className="py-2 pr-3">{b.currency}</td>
                            <td className="py-2 pr-3">
                              <span className="font-mono text-xs">
                                {b.ref_table ?? "-"}
                                {b.ref_id ? `/#${b.ref_id}` : ""}
                              </span>
                            </td>
                            <td className="py-2">
                              <div className="line-clamp-2 max-w-[280px] text-xs text-gray-700">{b.note ?? "-"}</div>
                            </td>
                          </tr>
                        );
                      })}

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
