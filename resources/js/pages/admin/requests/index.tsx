import React, { useEffect, useMemo, useState } from "react";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";

/* =========================================
   Types
========================================= */
type Status = "menunggu" | "dijadwalkan" | "diproses" | "selesai" | "dibatalkan";
type PayStatus = "pending" | "settled" | "failure" | "refunded" | "cancelled";

// --- Badge styles & labels ---
const STATUS_LABELS: Record<Status, string> = {
  menunggu: "Menunggu",
  dijadwalkan: "Dijadwalkan",
  diproses: "Diproses",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

const STATUS_STYLES: Record<Status, string> = {
  menunggu: "bg-slate-50 text-slate-700 border-slate-200",
  dijadwalkan: "bg-indigo-50 text-indigo-700 border-indigo-200",
  diproses: "bg-amber-50 text-amber-700 border-amber-200",
  selesai: "bg-green-50 text-green-700 border-green-200",
  dibatalkan: "bg-rose-50 text-rose-700 border-rose-200",
};

const PAY_LABELS: Record<PayStatus, string> = {
  pending: "Pending",
  settled: "Settled",
  failure: "Failure",
  refunded: "Refunded",
  cancelled: "Cancelled",
};

const PAY_STYLES: Record<PayStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  settled: "bg-green-50 text-green-700 border-green-200",
  failure: "bg-rose-50 text-rose-700 border-rose-200",
  refunded: "bg-cyan-50 text-cyan-700 border-cyan-200",
  cancelled: "bg-slate-50 text-slate-700 border-slate-200",
};

type MiniUser = { id: number; name: string; email: string; phone?: string | null };
type PaymentLite = { id: number; amount: number | string; status: PayStatus; paid_at?: string | null };

type ServiceRequest = {
  id: number;
  user_id: number;
  technician_id?: number | null;
  category: string;
  description?: string | null;
  scheduled_for?: string | null;
  accepted_price?: number | string | null;
  status: Status;
  created_at?: string;
  updated_at?: string;
  user?: MiniUser;
  technician?: MiniUser | null;
  payment?: PaymentLite | null;
};

type Category = { slug: string; name: string };

// Laravel paginator shape we use
type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links?: Array<{ url: string | null; label: string; active: boolean }>;
};

type PageProps = {
  auth?: { user?: { name?: string } };
  requests?: Paginated<ServiceRequest> | ServiceRequest[];
  categories?: Category[];
  technicians?: MiniUser[];
  users?: MiniUser[];
  filters?: {
    q?: string;
    status?: Status | "";
    category?: string;
    pay?: PayStatus | "";
    date_from?: string;
    date_to?: string;
    technician_id?: string;
    user_id?: string;
    perPage?: number;
    page?: number;
  };
};

/* =========================================
   Helpers
========================================= */
function isPaginatedRequests(r: PageProps["requests"]): r is Paginated<ServiceRequest> {
  return typeof r === "object" && r !== null && !Array.isArray(r) && Array.isArray((r as Paginated<ServiceRequest>).data);
}

const DEFAULT_CATEGORIES: Category[] = [
  { slug: "ac", name: "AC" },
  { slug: "tv", name: "TV" },
  { slug: "kulkas", name: "Kulkas" },
  { slug: "mesin-cuci", name: "Mesin Cuci" },
];

function categoryName(slug: string, list: Category[]): string {
  return list.find((c) => c.slug === slug)?.name ?? slug;
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
  if (Number.isNaN(d.getTime())) return iso as string;
  return d.toLocaleString("id-ID", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* =========================================
   Pagination (gaya Filament, di BAWAH tabel)
========================================= */
function RequestsPagination({
  meta,
  filters,
  baseUrl = "/admin/requests",
}: {
  meta: Pick<Paginated<ServiceRequest>, "current_page" | "last_page" | "per_page" | "total">;
  filters?: PageProps["filters"];
  baseUrl?: string;
}) {
  if (!meta || meta.last_page <= 1) return null;

  const goTo = (page: number, perPage = meta.per_page) => {
    const params: Record<string, string | number> = { page, perPage };
    if (filters?.q) params.q = filters.q;
    if (filters?.status) params.status = filters.status;
    if (filters?.category) params.category = filters.category;
    if (filters?.pay) params.pay = filters.pay;
    if (filters?.date_from) params.date_from = filters.date_from;
    if (filters?.date_to) params.date_to = filters.date_to;
    if (filters?.technician_id) params.technician_id = filters.technician_id;
    if (filters?.user_id) params.user_id = filters.user_id;
    router.get(baseUrl, params, { preserveScroll: true, preserveState: true });
  };

  const changePerPage = (pp: number) => {
    const params = { ...(filters ?? {}), page: 1, perPage: pp };
    router.get(baseUrl, params, { preserveScroll: true, preserveState: true });
  };

  // pages: 1 … (cur-2..cur+2) … last
  const pages: Array<number | string> = (() => {
    const total = meta.last_page;
    const cur = meta.current_page;
    const delta = 2;
    const acc: number[] = [1];
    for (let i = cur - delta; i <= cur + delta; i++) {
      if (i > 1 && i < total) acc.push(i);
    }
    if (total > 1) acc.push(total);
    const out: Array<number | string> = [];
    let prev: number | null = null;
    for (const n of [...new Set(acc)].sort((a, b) => a - b)) {
      if (prev !== null) {
        if (n - prev === 2) out.push(prev + 1);
        else if (n - prev > 2) out.push("…");
      }
      out.push(n);
      prev = n;
    }
    return out;
  })();

  const from = meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
  const to = Math.min(meta.current_page * meta.per_page, meta.total);

  return (
    <nav className="mt-4 flex flex-col items-stretch gap-3 rounded-xl border border-gray-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs text-gray-500">
        Menampilkan <span className="font-medium text-gray-700">{from}</span> –{" "}
        <span className="font-medium text-gray-700">{to}</span> dari{" "}
        <span className="font-medium text-gray-700">{meta.total}</span> data
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="inline-flex items-center gap-2">
          <select
            value={meta.per_page}
            onChange={(e) => changePerPage(Number(e.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-800"
            aria-label="Jumlah data per halaman"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span className="text-xs text-gray-500">per page</span>
        </div>

        <ul className="inline-flex select-none items-center gap-1">
          <li>
            <button
              type="button"
              disabled={meta.current_page <= 1}
              onClick={() => goTo(meta.current_page - 1)}
              className="min-w-[2.25rem] rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:text-gray-300"
              aria-label="Sebelumnya"
            >
              ‹
            </button>
          </li>
          {pages.map((p, i) =>
            p === "…" ? (
              <li key={`dots-${i}`} className="px-2 text-sm text-gray-400">…</li>
            ) : (
              <li key={`p-${p}`}>
                <button
                  type="button"
                  aria-current={p === meta.current_page ? "page" : undefined}
                  onClick={() => goTo(p as number)}
                  className={[
                    "min-w-[2.25rem] rounded-lg border px-3 py-1.5 text-sm transition-transform",
                    p === meta.current_page
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50 hover:scale-[1.02] active:scale-95",
                  ].join(" ")}
                >
                  {p}
                </button>
              </li>
            )
          )}
          <li>
            <button
              type="button"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => goTo(meta.current_page + 1)}
              className="min-w-[2.25rem] rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:text-gray-300"
              aria-label="Berikutnya"
            >
              ›
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

/* =========================================
   NAV (selaras halaman admin lain)
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

/* =========================================
   Page
========================================= */
export default function AdminRequestsIndex() {
  const page = usePage<PageProps>();
  const currentUrl = page.url;
  const { auth, requests, categories, technicians, users, filters } = page.props;

  const cats = useMemo<Category[]>(
    () => (categories && categories.length ? categories : DEFAULT_CATEGORIES),
    [categories]
  );

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSidebarOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Items
  const items: ServiceRequest[] = useMemo(() => {
    if (Array.isArray(requests)) return requests;
    if (isPaginatedRequests(requests)) return requests.data;
    return [];
  }, [requests]);

  // Meta pagination (hanya jika server kirim paginator)
  const meta = useMemo(() => {
    if (!isPaginatedRequests(requests)) return null;
    const { current_page, last_page, per_page, total } = requests;
    return { current_page, last_page, per_page, total };
  }, [requests]);

  // Filter form
  const filterForm = useForm({
    q: filters?.q ?? "",
    status: (filters?.status ?? "") as string,
    category: filters?.category ?? "",
    pay: (filters?.pay ?? "") as string,
    date_from: filters?.date_from ?? "",
    date_to: filters?.date_to ?? "",
    technician_id: filters?.technician_id ?? "",
    user_id: filters?.user_id ?? "",
  });

  const submitFilter: React.FormEventHandler = (e) => {
    e.preventDefault();
    router.get(
      "/admin/requests",
      { ...filterForm.data, perPage: filters?.perPage ?? meta?.per_page ?? 10, page: 1 },
      { preserveState: true, replace: true }
    );
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
      only: ["requests"],
      onFinish: () => setRefreshing(false),
      onError: () => setRefreshing(false),
    });
  };

  return (
    <>
      <Head title="Permintaan Service" />
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
                    <h1 className="text-lg font-semibold text-gray-900">Permintaan Servis</h1>
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
                      title="Muat ulang data permintaan servis"
                    >
                      <i className={["fas", "fa-sync-alt", refreshing ? "animate-spin" : ""].join(" ")} />
                      {refreshing ? "Menyegarkan…" : "Refresh"}
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-2.5 py-1.5">
                    <i className="fas fa-user-shield text-gray-500" />
                    <span className="text-sm text-gray-800">{auth?.user?.name ?? "Admin"}</span>
                  </div>
                </div>

              </div>
            </header>

            {/* Main */}
            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {/* Actions */}
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="hidden sm:inline">Pantau permintaan servis, status, dan pembayaran.</span>
                </div>
                <div className="hidden sm:flex items-center gap-2">{/* extra actions here */}</div>
              </div>

              {/* Filter */}
              <form onSubmit={submitFilter} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                {/* BARIS 1 */}
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                  {/* Cari */}
                  <div className="lg:col-span-5">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Cari</label>
                    <div className="relative">
                      <i className="fas fa-search pointer-events-none absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        value={filterForm.data.q}
                        onChange={(e) => filterForm.setData("q", e.target.value)}
                        placeholder="ID, nama/email, deskripsi…"
                        className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="lg:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
                    <select
                      value={filterForm.data.status}
                      onChange={(e) => filterForm.setData("status", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                    >
                      <option value="">Semua</option>
                      <option value="menunggu">Menunggu</option>
                      <option value="dijadwalkan">Dijadwalkan</option>
                      <option value="diproses">Diproses</option>
                      <option value="selesai">Selesai</option>
                      <option value="dibatalkan">Dibatalkan</option>
                    </select>
                  </div>

                  {/* Kategori */}
                  <div className="lg:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Kategori</label>
                    <select
                      value={filterForm.data.category}
                      onChange={(e) => filterForm.setData("category", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                    >
                      <option value="">Semua</option>
                      {(categories && categories.length ? categories : DEFAULT_CATEGORIES).map((c) => (
                        <option key={c.slug} value={c.slug}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Pembayaran */}
                  <div className="lg:col-span-3">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Pembayaran</label>
                    <select
                      value={filterForm.data.pay}
                      onChange={(e) => filterForm.setData("pay", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                    >
                      <option value="">Semua</option>
                      <option value="pending">Pending</option>
                      <option value="settled">Settled</option>
                      <option value="failure">Failure</option>
                      <option value="refunded">Refunded</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* BARIS 2 */}
                <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-12">
                  {/* Rentang tanggal (Dari–Sampai) */}
                  <div className="lg:col-span-5">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Rentang Tanggal</label>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                      <div className="sm:col-span-2">
                        <input
                          type="date"
                          value={filterForm.data.date_from}
                          onChange={(e) => filterForm.setData("date_from", e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                          placeholder="Dari"
                        />
                      </div>
                      <div className="hidden items-center justify-center text-xs text-gray-400 sm:flex">s/d</div>
                      <div className="sm:col-span-2">
                        <input
                          type="date"
                          value={filterForm.data.date_to}
                          onChange={(e) => filterForm.setData("date_to", e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                          placeholder="Sampai"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Teknisi */}
                  <div className="lg:col-span-3">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Teknisi</label>
                    <select
                      value={filterForm.data.technician_id}
                      onChange={(e) => filterForm.setData("technician_id", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                    >
                      <option value="">Semua</option>
                      {(technicians ?? []).map((t) => (
                        <option key={t.id} value={String(t.id)}>{t.name} — {t.email}</option>
                      ))}
                    </select>
                  </div>

                  {/* User */}
                  <div className="lg:col-span-4">
                    <label className="mb-1 block text-xs font-medium text-gray-600">User</label>
                    <select
                      value={filterForm.data.user_id}
                      onChange={(e) => filterForm.setData("user_id", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                    >
                      <option value="">Semua</option>
                      {(users ?? []).map((u) => (
                        <option key={u.id} value={String(u.id)}>{u.name} — {u.email}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Aksi */}
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition-transform hover:bg-gray-50 hover:scale-[1.02] active:scale-95"
                  >
                    <i className="fas fa-filter" /> Terapkan
                  </button>
                  <Link
                    href="/admin/requests"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition-transform hover:bg-gray-50 hover:scale-[1.02] active:scale-95"
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
                        <th className="py-2 pr-3">User</th>
                        <th className="py-2 pr-3">Teknisi</th>
                        <th className="py-2 pr-3">Kategori</th>
                        <th className="py-2 pr-3">Jadwal</th>
                        <th className="py-2 pr-3">Harga</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2 pr-3">Pembayaran</th>
                        <th className="py-2 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((r) => (
                        <tr key={r.id} className="text-gray-800">
                          <td className="py-2 pr-3 font-semibold">#{r.id}</td>
                          <td className="py-2 pr-3">{fmtDateTime(r.created_at)}</td>
                          <td className="py-2 pr-3">
                            {r.user ? (
                              <>
                                <div className="font-medium">{r.user.name}</div>
                                <div className="text-xs text-gray-500">{r.user.email}</div>
                              </>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-2 pr-3">
                            {r.technician ? (
                              <>
                                <div className="font-medium">{r.technician.name}</div>
                                <div className="text-xs text-gray-500">{r.technician.email}</div>
                              </>
                            ) : (
                              <span className="text-gray-400">Belum</span>
                            )}
                          </td>
                          <td className="py-2 pr-3">{categoryName(r.category, cats)}</td>
                          <td className="py-2 pr-3">{fmtDateTime(r.scheduled_for)}</td>
                          <td className="py-2 pr-3">{r.accepted_price ? fmtPrice(r.accepted_price) : "-"}</td>
                          <td className="py-2 pr-3">
                            <span
                              className={[
                                "inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-xs font-medium",
                                STATUS_STYLES[r.status],
                              ].join(" ")}
                            >
                              <i className="fas fa-circle text-[8px]" />
                              {STATUS_LABELS[r.status] ?? r.status}
                            </span>
                          </td>
                          <td className="py-2 pr-3">
                            {r.payment ? (
                              <span
                                className={[
                                  "inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-xs font-medium",
                                  PAY_STYLES[r.payment.status],
                                ].join(" ")}
                              >
                                <i className="fas fa-receipt text-[10px]" />
                                {PAY_LABELS[r.payment.status] ?? r.payment.status}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-2">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/admin/requests/${r.id}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-transform hover:bg-gray-50 hover:scale-[1.02] active:scale-95"
                              >
                                <i className="fas fa-eye" /> Lihat
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {items.length === 0 && (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-sm text-gray-500">
                            Tidak ada data.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination di bawah tabel */}
                {meta && <RequestsPagination meta={meta} filters={filters} />}
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
