import React, { useEffect, useMemo, useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";

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

type LedgerType =
  | "hold"
  | "payout"
  | "adjustment"
  | "refund_credit"
  | "refund_reversal"
  | "payment_debit";

type LedgerEntry = {
  id: number;
  owner_role: "technician" | "user";
  owner_id: number;
  amount: number | string;
  currency: string;
  type: LedgerType;
  ref_table?: string | null;
  ref_id?: number | null;
  note?: string | null;
  created_at?: string | null;
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
  updated_at?: string | null;

  technician?: MiniUser | null;
};

type PageProps = {
  auth?: { user?: { name?: string } };
  payout?: Payout;
  ledger?: LedgerEntry[];
};

/* =========================================
   Helpers
========================================= */
function fmtPrice(v?: number | string | null): string {
  const n = typeof v === "string" ? Number(v) : v ?? 0;
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);
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
   Timeline sederhana
========================================= */
function Timeline({
  status,
  createdAt,
  paidAt,
}: {
  status: PayoutStatus;
  createdAt?: string | null;
  paidAt?: string | null;
}) {
  const steps: Array<{
    key: PayoutStatus | "created";
    label: string;
    when?: string | null;
    active: boolean;
    icon: string;
  }> = [
      { key: "created", label: "Dibuat", when: createdAt ?? null, active: true, icon: "fa-circle" },
      {
        key: "pending",
        label: "Pending",
        when: createdAt ?? null,
        active: status === "pending" || status === "paid" || status === "rejected",
        icon: "fa-hourglass-half",
      },
      { key: "paid", label: "Paid", when: paidAt ?? null, active: status === "paid", icon: "fa-check" },
      { key: "rejected", label: "Rejected", when: null, active: status === "rejected", icon: "fa-times" },
    ];

  return (
    <ol className="space-y-3">
      {steps.map((s) => (
        <li key={s.key} className="flex items-start gap-3">
          <span
            className={`grid h-6 w-6 place-items-center rounded-full ${s.active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"
              }`}
          >
            <i className={`fas ${s.icon}`} />
          </span>
          <div>
            <div className={`text-sm font-semibold ${s.active ? "text-gray-900" : "text-gray-500"}`}>{s.label}</div>
            <div className="text-xs text-gray-500">{s.when ? fmtDateTime(s.when) : "-"}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* =========================================
   Page
========================================= */
export default function AdminPayoutShow() {
  const page = usePage<PageProps>();
  const currentUrl = page.url;
  const { auth } = page.props;

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSidebarOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Data
  const payout: Payout = useMemo<Payout>(() => {
    if (page.props.payout) return page.props.payout;
    // fallback demo supaya layout tetap render
    return {
      id: 5001,
      technician_id: 2,
      amount: 350000,
      status: "paid",
      bank_name: "BCA",
      account_name: "Nina Rahma",
      account_number: "1234567890",
      paid_at: new Date().toISOString(),
      note: "Pencairan periode Agustus",
      created_at: new Date().toISOString(),
      technician: { id: 2, name: "Nina Rahma", email: "nina@example.com", phone: "0812-0000-0000" },
    };
  }, [page.props.payout]);

  const ledger: LedgerEntry[] = useMemo<LedgerEntry[]>(
    () => (page.props.ledger && page.props.ledger.length ? page.props.ledger : []),
    [page.props.ledger]
  );

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
      <Head title={`Payout #${payout.id} — Admin`} />
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
                <div className="flex items-center gap-3">
                  <button
                    className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 md:hidden"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Buka menu"
                  >
                    <i className="fas fa-bars" />
                  </button>
                  <Link
                    href="/admin/payouts"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <i className="fas fa-arrow-left" /> Kembali
                  </Link>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-gray-500">Admin</div>
                    <h1 className="text-lg font-semibold text-gray-900">Pencairan Dana #{payout.id}</h1>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <PayoutBadge status={payout.status} />
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
                  <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-2.5 py-1.5">
                    <i className="fas fa-user-shield text-gray-500" />
                    <span className="text-sm text-gray-800">{auth?.user?.name ?? "Admin"}</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Main */}
            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* LEFT: Summary, Technician, Bank */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Summary */}
                  <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <h2 className="mb-3 text-base font-semibold text-gray-900">Ringkasan Payout</h2>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-xs text-gray-500">Jumlah</div>
                        <div className="text-lg font-semibold text-gray-900">{fmtPrice(payout.amount)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Status</div>
                        <div className="mt-0.5">
                          <PayoutBadge status={payout.status} />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Dibayar</div>
                        <div className="font-medium text-gray-900">{fmtDateTime(payout.paid_at)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Dibuat</div>
                        <div className="font-medium text-gray-900">{fmtDateTime(payout.created_at)}</div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-xs text-gray-500">Catatan</div>
                      <div className="whitespace-pre-wrap text-gray-800">{payout.note ?? "-"}</div>
                    </div>
                  </section>

                  {/* Technician */}
                  <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <h2 className="mb-3 text-base font-semibold text-gray-900">Teknisi</h2>
                    {payout.technician ? (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <div>
                          <div className="text-xs text-gray-500">Nama</div>
                          <div className="font-medium text-gray-900">{payout.technician.name}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Email</div>
                          <div className="text-gray-800">{payout.technician.email}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Telepon</div>
                          <div className="text-gray-800">{payout.technician.phone ?? "-"}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">ID: {payout.technician_id}</div>
                    )}
                  </section>

                  {/* Bank snapshot */}
                  <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <h2 className="mb-3 text-base font-semibold text-gray-900">Rekening Tujuan (Snapshot)</h2>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <div className="text-xs text-gray-500">Bank</div>
                        <div className="font-medium text-gray-900">{payout.bank_name ?? "-"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Nama Pemilik</div>
                        <div className="font-medium text-gray-900">{payout.account_name ?? "-"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">No. Rekening</div>
                        <div className="font-mono text-xs text-gray-800">{payout.account_number ?? "-"}</div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* RIGHT: Timeline & Ledger */}
                <div className="space-y-4">
                  {/* Timeline */}
                  <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <h2 className="mb-3 text-base font-semibold text-gray-900">Timeline Status</h2>
                    <Timeline status={payout.status} createdAt={payout.created_at} paidAt={payout.paid_at} />
                  </section>

                  {/* Ledger (opsional) */}
                  <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-base font-semibold text-gray-900">Ledger Terkait</h2>
                      {ledger.length > 0 && <span className="text-xs text-gray-500">{ledger.length} entri</span>}
                    </div>

                    {ledger.length === 0 ? (
                      <div className="text-sm text-gray-500">Belum ada entri ledger yang ditautkan.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-500">
                              <th className="py-2 pr-3">ID</th>
                              <th className="py-2 pr-3">Waktu</th>
                              <th className="py-2 pr-3">Tipe</th>
                              <th className="py-2 pr-3">Amount</th>
                              <th className="py-2 pr-3">Ref</th>
                              <th className="py-2">Catatan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {ledger.map((l) => (
                              <tr key={l.id} className="text-gray-800">
                                <td className="py-2 pr-3 font-medium">#{l.id}</td>
                                <td className="py-2 pr-3">{fmtDateTime(l.created_at)}</td>
                                <td className="py-2 pr-3">{l.type}</td>
                                <td className="py-2 pr-3">{fmtPrice(l.amount)}</td>
                                <td className="py-2 pr-3">
                                  <span className="font-mono text-xs">
                                    {l.ref_table ?? "-"}{l.ref_id ? `/#${l.ref_id}` : ""}
                                  </span>
                                </td>
                                <td className="py-2">{l.note ?? "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
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
