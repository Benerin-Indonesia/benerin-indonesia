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

const TYPE_LABEL: Record<LedgerType, string> = {
  hold: "Ditahan",
  payout: "Pencairan",
  adjustment: "Penyesuaian",
  refund_credit: "Gaji",
  refund_reversal: "Batal Refund",
  payment_debit: "Fee",
};

function normalizeLedgerType(raw?: string | null): LedgerType | "unknown" {
  if (!raw) return "unknown";
  const t = String(raw).toLowerCase().trim();
  if (["hold", "escrow_hold", "on_hold", "escrow"].includes(t)) return "hold";
  if (["payout_request", "withdraw_request"].includes(t)) return "payout";
  if (["payout", "withdraw", "disburse", "disbursement"].includes(t)) return "payout";
  if (["adjustment", "manual_adjustment", "correction"].includes(t)) return "adjustment";
  if (["escrow_release", "release", "credit_release"].includes(t)) return "refund_credit";
  if (["refund_credit", "refund", "refund_plus", "credit"].includes(t)) return "refund_credit";
  if (["service_fee", "fee", "platform_fee", "admin_fee"].includes(t)) return "payment_debit";
  if (["refund_reversal", "chargeback_reversal", "refund_minus"].includes(t)) return "refund_reversal";
  if (["payment_debit", "payment", "debit", "charge"].includes(t)) return "payment_debit";
  return "unknown";
}

const TYPE_LABEL_FALLBACK = "Lainnya";

type MiniOwner = {
  id: number;
  role: OwnerRole;
  name: string;
  email: string;
  phone?: string | null;
};

// field rekening bank
type OwnerWithBank = MiniOwner & {
  bank_name?: string | null;
  account_name?: string | null;
  account_number?: string | null;
};

type BalanceEntry = {
  id: number;
  owner_role: OwnerRole;
  owner_id: number;
  amount: number | string;
  currency: string;
  type: string;
  ref_table?: string | null;
  ref_id?: number | null;
  note?: string | null;
  created_at?: string | null;
};

type Paginated<T> = { data: T[] };

type PageProps = {
  auth?: { user?: { name?: string } };
  owner?: OwnerWithBank;
  entries?: Paginated<BalanceEntry> | BalanceEntry[];
  filters?: {
    q?: string;
    type?: LedgerType | "";
    date_from?: string;
    date_to?: string;
    amount_min?: string;
    amount_max?: string;
  };
};

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
    year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}
function RoleBadge({ role }: { role: OwnerRole }) {
  const cls = role === "teknisi"
    ? "bg-indigo-50 text-indigo-700 border-indigo-100"
    : "bg-sky-50 text-sky-700 border-sky-100";
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium ${cls}`}>
      <i className={`fas ${role === "teknisi" ? "fa-tools" : "fa-user"}`} /> {role}
    </span>
  );
}
function TypeBadge({ type: raw }: { type: string }) {
  const norm = normalizeLedgerType(raw);
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
    refund_credit: "fa-hand-holding-usd",
    refund_reversal: "fa-redo",
    payment_debit: "fa-credit-card",
  };
  const cls = norm === "unknown" ? "bg-gray-50 text-gray-700 border-gray-200" : map[norm];
  const ico = norm === "unknown" ? "fa-tag" : icon[norm];
  const label = norm === "unknown" ? TYPE_LABEL_FALLBACK : TYPE_LABEL[norm];
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium ${cls}`}>
      <i className={`fas ${ico}`} /> {label}
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

const BANK_UPDATE_URL = (ownerId: number) => `/admin/users/${ownerId}/bank`;

/* =========================================
   Page
========================================= */
export default function AdminBalanceShow() {
  const page = usePage<PageProps>();
  const { auth } = page.props;
  const raw = page.props.entries;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSidebarOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const demoOwner: OwnerWithBank = {
    id: 2, role: "teknisi", name: "Nina Rahma", email: "nina@example.com", phone: "0812-3456-7890",
    bank_name: "BCA", account_name: "NINA RAHMA", account_number: "1234567890",
  };

  const entries: BalanceEntry[] = useMemo(() => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return raw.data;
  }, [raw]);

  const theOwner: OwnerWithBank = page.props.owner ?? demoOwner;

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return ta - tb;
    }),
    [entries]
  );

  const { totalCredit, totalDebit, finalBalance, withRunning } = useMemo(() => {
    let credit = 0, debit = 0, running = 0;
    const rows = sortedEntries.map((e) => {
      const n = toNumber(e.amount);
      if (n >= 0) credit += n; else debit += n;
      running += n;
      return { ...e, _running: running };
    });
    return {
      totalCredit: credit, totalDebit: debit,
      finalBalance: credit + debit,
      withRunning: rows as (BalanceEntry & { _running: number })[],
    };
  }, [sortedEntries]);

  const urlBase = `/admin/balances/${theOwner.role}/${theOwner.id}`;
  const filterForm = useForm({
    q: page.props.filters?.q ?? "",
    type: (page.props.filters?.type ?? "") as string,
    date_from: page.props.filters?.date_from ?? "",
    date_to: page.props.filters?.date_to ?? "",
    amount_min: page.props.filters?.amount_min ?? "",
    amount_max: page.props.filters?.amount_max ?? "",
  });
  const submitFilter: React.FormEventHandler = (e) => {
    e.preventDefault();
    router.get(urlBase, filterForm.data, { preserveState: true, replace: true });
  };

  // ===== Rekening bank: read-only by default, toggle edit
  const [isEditingBank, setIsEditingBank] = useState(false);
  const bankForm = useForm({
    bank_name: theOwner.bank_name ?? "",
    account_name: theOwner.account_name ?? "",
    account_number: theOwner.account_number ?? "",
  });

  const [savingBank, setSavingBank] = useState(false);
  const submitBank: React.FormEventHandler = (e) => {
    e.preventDefault();
    if (!isEditingBank) return; // cegah submit saat bukan mode edit
    setSavingBank(true);
    router.put(
      BANK_UPDATE_URL(theOwner.id),
      { ...bankForm.data },
      {
        preserveScroll: true,
        onFinish: () => { setSavingBank(false); setIsEditingBank(false); },
      }
    );
  };

  // helper tampilan input jika readonly
  const ro = (disabled: boolean) =>
    `w-full rounded-xl border px-3 py-2 text-sm outline-none ${disabled
      ? "bg-gray-50 border-gray-200 text-gray-700"
      : "bg-white border-gray-200 focus:ring-2 focus:ring-gray-900/20"
    }`;

  const [refreshing, setRefreshing] = useState(false);
  const doRefresh = () => {
    setRefreshing(true);
    router.reload({
      only: ["entries", "owner"],
      onFinish: () => setRefreshing(false),
      onError: () => setRefreshing(false),
    });
  };

  const navItemCls = (active: boolean, collapsed: boolean) =>
    [
      "flex items-center rounded-xl px-3 py-2 text-sm font-medium transition",
      active ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-50",
      collapsed ? "justify-center" : "gap-3",
    ].join(" ");
  const sideWidth = sidebarCollapsed ? "md:w-20" : "md:w-72";
  const contentPadLeft = sidebarCollapsed ? "md:pl-20" : "md:pl-72";
  const isActive = (href: string) => location.pathname.startsWith(href);

  return (
    <>
      <Head title={`Saldo - ${theOwner.name}`} />
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {sidebarOpen && (
            <div className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px] md:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
          )}

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
                    <h1 className="text-lg font-semibold text-gray-900">Detail Saldo</h1>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/balances`}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <i className="fas fa-arrow-left" /> Kembali
                  </Link>
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
              {/* Owner Card */}
              <section className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-gray-100 text-gray-600">
                      <i className={`fas ${theOwner.role === "teknisi" ? "fa-tools" : "fa-user"} text-lg`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-gray-900">{theOwner.name}</h2>
                        <RoleBadge role={theOwner.role} />
                      </div>
                      <div className="text-xs text-gray-600">{theOwner.email}</div>
                      {theOwner.phone && <div className="text-xs text-gray-500">{theOwner.phone}</div>}
                      <div className="mt-1 text-[11px] text-gray-500">ID: {theOwner.role} #{theOwner.id}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                    <div className="rounded-xl border border-gray-100 bg-white p-3">
                      <div className="text-[11px] text-gray-500">Total Kredit</div>
                      <div className="text-sm font-semibold text-emerald-700">{fmtPrice(totalCredit)}</div>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-white p-3">
                      <div className="text-[11px] text-gray-500">Total Debit</div>
                      <div className="text-sm font-semibold text-rose-600">{fmtPrice(totalDebit)}</div>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-white p-3">
                      <div className="text-[11px] text-gray-500">Saldo Akhir</div>
                      <div className={`text-sm font-semibold ${finalBalance >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                        {fmtPrice(finalBalance)}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Rekening Bank: Read-only default, toggle edit */}
              <section className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Rekening Bank</h3>
                  <div className="flex items-center gap-2">
                    {!isEditingBank ? (
                      <button
                        type="button"
                        onClick={() => setIsEditingBank(true)}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                      >
                        <i className="fas fa-edit" /> Edit
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingBank(false);
                            bankForm.setData({
                              bank_name: theOwner.bank_name ?? "",
                              account_name: theOwner.account_name ?? "",
                              account_number: theOwner.account_number ?? "",
                            });
                          }}
                          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                        >
                          <i className="fas fa-times" /> Batal
                        </button>
                        <button
                          type="submit"
                          form="bank-form"
                          disabled={savingBank}
                          className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold text-white ${savingBank ? "bg-gray-400" : "bg-gray-900 hover:bg-black"}`}
                        >
                          <i className={`fas ${savingBank ? "fa-spinner animate-spin" : "fa-save"}`} />
                          Simpan
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <form id="bank-form" onSubmit={submitBank} className="grid grid-cols-1 gap-3 lg:grid-cols-6">
                  <div className="lg:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Nama Bank</label>
                    <input
                      type="text"
                      value={bankForm.data.bank_name}
                      onChange={(e) => bankForm.setData("bank_name", e.target.value)}
                      disabled={!isEditingBank}
                      placeholder="Mis. BCA / BNI / BRI / Mandiri"
                      className={ro(!isEditingBank)}
                    />
                    {bankForm.errors.bank_name && <div className="mt-1 text-xs text-rose-600">{bankForm.errors.bank_name}</div>}
                  </div>

                  <div className="lg:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Nama Pemilik Rekening</label>
                    <input
                      type="text"
                      value={bankForm.data.account_name}
                      onChange={(e) => bankForm.setData("account_name", e.target.value)}
                      disabled={!isEditingBank}
                      placeholder="Sesuai buku tabungan"
                      className={ro(!isEditingBank)}
                    />
                    {bankForm.errors.account_name && <div className="mt-1 text-xs text-rose-600">{bankForm.errors.account_name}</div>}
                  </div>

                  <div className="lg:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Nomor Rekening</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={bankForm.data.account_number}
                      onChange={(e) => bankForm.setData("account_number", e.target.value)}
                      disabled={!isEditingBank}
                      placeholder="Tanpa spasi/tanda baca"
                      className={ro(!isEditingBank)}
                    />
                    {bankForm.errors.account_number && <div className="mt-1 text-xs text-rose-600">{bankForm.errors.account_number}</div>}
                  </div>
                </form>
              </section>

              {/* Filter */}
              <form onSubmit={submitFilter} className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
                  <div className="lg:col-span-3">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Cari</label>
                    <div className="relative">
                      <i className="fas fa-search pointer-events-none absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        value={filterForm.data.q}
                        onChange={(e) => filterForm.setData("q", e.target.value)}
                        placeholder="ID transaksi / Ref / Catatan…"
                        className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
                    <select
                      value={filterForm.data.type}
                      onChange={(e) => filterForm.setData("type", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                    >
                      <option value="">Semua</option>
                      {(["hold", "payout", "adjustment", "refund_credit", "refund_reversal", "payment_debit"] as LedgerType[]).map((t) => (
                        <option key={t} value={t}>{TYPE_LABEL[t]}</option>
                      ))}
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

                  <div className="lg:col-span-4 flex items-end gap-2">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      <i className="fas fa-filter" /> Terapkan
                    </button>
                    <Link
                      href={urlBase}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                      preserveState
                      replace
                    >
                      <i className="fas fa-undo" /> Reset
                    </Link>
                  </div>
                </div>
              </form>

              {/* Tabel Riwayat */}
              <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Riwayat Transaksi</h3>
                  <div className="text-xs text-gray-500">
                    Total {withRunning.length} transaksi • Saldo akhir:{" "}
                    <span className={finalBalance >= 0 ? "text-emerald-700 font-semibold" : "text-rose-600 font-semibold"}>
                      {fmtPrice(finalBalance)}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="py-2 pr-3">ID</th>
                        <th className="py-2 pr-3">Waktu</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2 pr-3">Jumlah</th>
                        <th className="py-2 pr-3">Mata Uang</th>
                        <th className="py-2 pr-3">Ref</th>
                        <th className="py-2 pr-3">Berjalan</th>
                        <th className="py-2">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {withRunning.map((e) => {
                        const n = toNumber(e.amount);
                        const amountClass = n < 0 ? "text-rose-600" : "text-emerald-700";
                        const runningClass = e._running < 0 ? "text-rose-600" : "text-emerald-700";
                        return (
                          <tr key={e.id} className="text-gray-800">
                            <td className="py-2 pr-3 font-semibold">#{e.id}</td>
                            <td className="py-2 pr-3">{fmtDateTime(e.created_at)}</td>
                            <td className="py-2 pr-3">
                              <TypeBadge type={e.type} />
                            </td>
                            <td className={`py-2 pr-3 font-semibold ${amountClass}`}>{fmtPrice(e.amount)}</td>
                            <td className="py-2 pr-3">{(e.currency || "").toUpperCase()}</td>
                            <td className="py-2 pr-3">
                              <span className="font-mono text-xs">
                                {e.ref_table ?? "-"}
                                {e.ref_id ? `/#${e.ref_id}` : ""}
                              </span>
                            </td>
                            <td className={`py-2 pr-3 font-semibold ${runningClass}`}>{fmtPrice(e._running)}</td>
                            <td className="py-2">
                              <div className="line-clamp-2 max-w-[280px] text-xs text-gray-700">{e.note ?? "-"}</div>
                            </td>
                          </tr>
                        );
                      })}

                      {withRunning.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-sm text-gray-500">
                            Tidak ada transaksi.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </main>

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
