import React, { useEffect, useMemo, useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";

/* =========================================
   Types
========================================= */
type PayStatus = "pending" | "settled" | "failure" | "refunded" | "cancelled";

type MiniUser = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
};

type RefundLite = {
  id: number;
  amount: number | string;
  status: "requested" | "processing" | "refunded" | "failed";
  reason?: string | null;
  refunded_at?: string | null;
  provider_ref?: string | null;
};

type ServiceRequestLite = {
  id: number;
  category: string;
  status: "menunggu" | "dijadwalkan" | "diproses" | "selesai" | "dibatalkan";
  accepted_price?: number | string | null;
};

type PaymentFull = {
  id: number;
  service_request_id: number;
  user_id: number;
  technician_id?: number | null;
  amount: number | string;
  status: PayStatus;
  provider: string;
  provider_ref?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  snap_token?: string | null;
  snap_redirect_url?: string | null;
  webhook_payload?: Record<string, unknown> | null;

  user?: MiniUser | null;
  technician?: MiniUser | null;
};

type PageProps = {
  auth?: { user?: { name?: string } };
  payment?: PaymentFull;
  request?: ServiceRequestLite | null;
  refunds?: RefundLite[] | null;
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
function PayBadge({ status }: { status: PayStatus }) {
  const map: Record<PayStatus, string> = {
    pending: "bg-gray-100 text-gray-700 border-gray-200",
    settled: "bg-emerald-50 text-emerald-700 border-emerald-100",
    failure: "bg-rose-50 text-rose-700 border-rose-100",
    refunded: "bg-amber-50 text-amber-800 border-amber-100",
    cancelled: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium ${map[status]}`}>
      <i className="fas fa-receipt" /> {status}
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
export default function AdminPaymentShow() {
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
  const payment: PaymentFull = useMemo<PaymentFull>(() => {
    if (page.props.payment) return page.props.payment;
    // fallback demo jika props belum dikirim backend (supaya halaman tetap render)
    return {
      id: 9001,
      service_request_id: 101,
      user_id: 1,
      technician_id: 2,
      amount: 250000,
      status: "settled",
      provider: "midtrans",
      provider_ref: "INV-2025-0001",
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      snap_token: "snap-demo-token",
      snap_redirect_url: "https://snap.midtrans.com/demo",
      webhook_payload: { transaction_status: "settlement", gross_amount: "250000" },
      user: { id: 1, name: "Agus Saputra", email: "agus@example.com" },
      technician: { id: 2, name: "Nina Rahma", email: "nina@example.com" },
    };
  }, [page.props.payment]);

  const req = useMemo<ServiceRequestLite | null>(() => page.props.request ?? null, [page.props.request]);
  const refunds = useMemo<RefundLite[]>(
    () => (page.props.refunds && page.props.refunds.length ? page.props.refunds : []),
    [page.props.refunds]
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
      <Head title={`Pembayaran #${payment.id}`} />
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
                    href="/admin/payments"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <i className="fas fa-arrow-left" /> Kembali
                  </Link>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-gray-500">Admin</div>
                    <h1 className="text-lg font-semibold text-gray-900">Pembayaran #{payment.id}</h1>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <PayBadge status={payment.status} />
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
                {/* LEFT: Summary & Relations */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Summary */}
                  <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <h2 className="mb-3 text-base font-semibold text-gray-900">Ringkasan Pembayaran</h2>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-xs text-gray-500">Jumlah</div>
                        <div className="text-lg font-semibold text-gray-900">{fmtPrice(payment.amount)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Status</div>
                        <div className="mt-0.5"><PayBadge status={payment.status} /></div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Provider</div>
                        <div className="font-medium text-gray-900">{payment.provider}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Ref</div>
                        <div className="font-mono text-xs text-gray-800">{payment.provider_ref ?? "-"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Dibayar</div>
                        <div className="font-medium text-gray-900">{fmtDateTime(payment.paid_at)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Dibuat</div>
                        <div className="font-medium text-gray-900">{fmtDateTime(payment.created_at)}</div>
                      </div>
                    </div>
                  </section>

                  {/* Relations */}
                  <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <h2 className="mb-3 text-base font-semibold text-gray-900">Relasi</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="rounded-xl border border-gray-100 p-3">
                        <div className="text-xs text-gray-500">Request</div>
                        <div className="mt-0.5">
                          <Link
                            href={`/admin/requests/${payment.service_request_id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            <i className="fas fa-clipboard-list" /> #{payment.service_request_id}
                          </Link>
                        </div>
                        {req && (
                          <div className="mt-2 text-xs text-gray-600">
                            Status: <span className="font-medium">{req.status}</span>
                            <br />
                            Harga Deal: <span className="font-medium">{req.accepted_price ? fmtPrice(req.accepted_price) : "-"}</span>
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl border border-gray-100 p-3">
                        <div className="text-xs text-gray-500">User</div>
                        {payment.user ? (
                          <>
                            <div className="font-semibold text-gray-900">{payment.user.name}</div>
                            <div className="text-sm text-gray-700">{payment.user.email}</div>
                            <div className="text-sm text-gray-700">{payment.user.phone ?? "-"}</div>
                          </>
                        ) : (
                          <div className="text-gray-500">-</div>
                        )}
                      </div>

                      <div className="rounded-xl border border-gray-100 p-3">
                        <div className="text-xs text-gray-500">Teknisi</div>
                        {payment.technician ? (
                          <>
                            <div className="font-semibold text-gray-900">{payment.technician.name}</div>
                            <div className="text-sm text-gray-700">{payment.technician.email}</div>
                            <div className="text-sm text-gray-700">{payment.technician.phone ?? "-"}</div>
                          </>
                        ) : (
                          <div className="text-gray-500">-</div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Webhook / Provider Detail */}
                  <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-base font-semibold text-gray-900">Detail Provider</h2>
                      {payment.snap_redirect_url && (
                        <a
                          href={payment.snap_redirect_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          <i className="fas fa-external-link-alt" /> Buka Snap
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-xs text-gray-500">Snap Token</div>
                        <div className="font-mono text-xs text-gray-800 break-all">{payment.snap_token ?? "-"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Redirect URL</div>
                        <div className="text-xs text-gray-800 break-all">{payment.snap_redirect_url ?? "-"}</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="mb-1 text-xs font-medium text-gray-600">Webhook Payload</div>
                      {payment.webhook_payload ? (
                        <pre className="max-h-[360px] overflow-auto rounded-xl border border-gray-100 bg-gray-50 p-3 text-[12px] leading-5">
                          {JSON.stringify(payment.webhook_payload, null, 2)}
                        </pre>
                      ) : (
                        <div className="text-sm text-gray-500">Tidak ada payload.</div>
                      )}
                    </div>
                  </section>
                </div>

                {/* RIGHT: Refunds */}
                <div className="space-y-4">
                  <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-base font-semibold text-gray-900">Refund</h2>
                      {refunds.length > 0 && (
                        <span className="text-xs text-gray-500">{refunds.length} data</span>
                      )}
                    </div>

                    {refunds.length === 0 ? (
                      <div className="text-sm text-gray-500">Tidak ada refund.</div>
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {refunds.map((r) => (
                          <li key={r.id} className="rounded-xl border border-gray-100 p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold">{fmtPrice(r.amount)}</div>
                                <div className="text-xs text-gray-500">{r.reason ?? "-"}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs uppercase tracking-wide text-gray-500">{r.status}</div>
                                <div className="text-xs text-gray-500">{fmtDateTime(r.refunded_at)}</div>
                              </div>
                            </div>
                            {r.provider_ref && (
                              <div className="mt-1 font-mono text-[11px] text-gray-500">
                                Ref: {r.provider_ref}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
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
