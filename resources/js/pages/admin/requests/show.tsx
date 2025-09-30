import React, { useEffect, useMemo, useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";

/* =========================================
   Types
========================================= */
// type Role = "user" | "teknisi" | "admin";
type Status = "menunggu" | "dijadwalkan" | "diproses" | "selesai" | "dibatalkan";
type PayStatus = "pending" | "settled" | "failure" | "refunded" | "cancelled";

type MiniUser = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
};

type Photo = {
  id: number;
  path: string;
  created_at?: string;
};

type Message = {
  id: number;
  service_request_id: number;
  sender_id: number;
  type: "text" | "offer" | "system";
  body?: string | null;
  payload?: Record<string, unknown> | null;
  is_read?: boolean;
  created_at?: string;
  sender?: MiniUser; // optional hydrate
};

type PaymentLite = {
  id: number;
  amount: number | string;
  status: PayStatus;
  provider?: string | null;
  provider_ref?: string | null;
  paid_at?: string | null;
  snap_redirect_url?: string | null;
};

type RefundLite = {
  id: number;
  amount: number | string;
  status: "requested" | "processing" | "refunded" | "failed";
  reason?: string | null;
  refunded_at?: string | null;
  provider_ref?: string | null;
};

type Category = { slug: string; name: string };

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

type PageProps = {
  auth?: { user?: { name?: string } };
  request?: ServiceRequest;
  categories?: Category[];
  photos?: Photo[];
  messages?: Message[];
  payment?: PaymentLite | null;
  refunds?: RefundLite[] | null;
};

/* =========================================
   Helpers & formatters
========================================= */
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
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* =========================================
   Badges
========================================= */
function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    menunggu: "bg-amber-50 text-amber-800 border-amber-100",
    dijadwalkan: "bg-indigo-50 text-indigo-700 border-indigo-100",
    diproses: "bg-blue-50 text-blue-700 border-blue-100",
    selesai: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dibatalkan: "bg-rose-50 text-rose-700 border-rose-100",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium ${map[status]}`}>
      <i className="fas fa-circle" /> {status}
    </span>
  );
}
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
   TIMELINE
========================================= */
const TIMELINE_ORDER: Status[] = ["menunggu", "dijadwalkan", "diproses", "selesai", "dibatalkan"];

function Timeline({ current, createdAt, scheduledFor, paidAt }: { current: Status; createdAt?: string; scheduledFor?: string | null; paidAt?: string | null; }) {
  // sederhana: highlight hingga current; tampilkan waktu relevan
  const stepIcon = (s: Status, active: boolean) =>
    <span className={`grid h-6 w-6 place-items-center rounded-full ${active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"}`}>
      <i className={`fas ${s === "selesai" ? "fa-check" : s === "dibatalkan" ? "fa-times" : "fa-circle"}`} />
    </span>;

  const untilCurrent = useMemo(() => {
    const idx = TIMELINE_ORDER.indexOf(current);
    return TIMELINE_ORDER.map((s, i) => ({ s, active: i <= idx && !(current === "dibatalkan" && s === "selesai") }));
  }, [current]);

  const whenText = (s: Status) => {
    switch (s) {
      case "menunggu": return fmtDateTime(createdAt);
      case "dijadwalkan": return fmtDateTime(scheduledFor ?? undefined);
      case "diproses": return paidAt ? `dibayar: ${fmtDateTime(paidAt)}` : "-";
      case "selesai": return "-";
      case "dibatalkan": return "-";
    }
  };

  return (
    <ol className="space-y-3">
      {untilCurrent.map(({ s, active }) => (
        <li key={s} className="flex items-start gap-3">
          {stepIcon(s, active)}
          <div>
            <div className={`text-sm font-semibold ${active ? "text-gray-900" : "text-gray-500"}`}>{s}</div>
            <div className="text-xs text-gray-500">{whenText(s)}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* =========================================
   Message bubble
========================================= */
function Bubble({ msg, isMine, who }: { msg: Message; isMine: boolean; who: "user" | "teknisi" | "system" }) {
  const base = "max-w-[80%] rounded-2xl px-3 py-2 text-sm";
  const mine = isMine ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800";
  const sys = who === "system" ? "bg-yellow-50 text-yellow-900 border border-yellow-100" : "";
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2`}>
      <div className={`${base} ${who === "system" ? sys : mine}`}>
        <div className="text-[11px] opacity-70 mb-1">
          {who === "system" ? "System" : (msg.sender?.name ?? (who === "user" ? "User" : "Teknisi"))} · {fmtDateTime(msg.created_at)}
        </div>
        {msg.type === "offer" ? (
          <>
            <div className="font-semibold mb-0.5">Penawaran</div>
            <pre className="text-[12px] leading-4 whitespace-pre-wrap">{JSON.stringify(msg.payload, null, 2)}</pre>
          </>
        ) : (
          <div>{msg.body ?? <em>(tanpa teks)</em>}</div>
        )}
      </div>
    </div>
  );
}

/* =========================================
   Page
========================================= */
export default function AdminRequestShow() {
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
  const cats = useMemo<Category[]>(
    () => (page.props.categories && page.props.categories.length ? page.props.categories : DEFAULT_CATEGORIES),
    [page.props.categories]
  );
  const req: ServiceRequest = useMemo<ServiceRequest>(() => {
    if (page.props.request) return page.props.request;
    // fallback demo
    return {
      id: 101,
      user_id: 1,
      technician_id: 2,
      category: "ac",
      description: "AC kamar mati total",
      scheduled_for: new Date().toISOString(),
      accepted_price: 250000,
      status: "dijadwalkan",
      created_at: new Date().toISOString(),
      user: { id: 1, name: "Agus Saputra", email: "agus@example.com" },
      technician: { id: 2, name: "Nina Rahma", email: "nina@example.com" },
      payment: { id: 99, amount: 250000, status: "settled", paid_at: new Date().toISOString(), provider: "midtrans" },
    };
  }, [page.props.request]);

  const photos = useMemo<Photo[]>(() => page.props.photos ?? [], [page.props.photos]);
  const messages = useMemo<Message[]>(() => page.props.messages ?? [], [page.props.messages]);
  const payment = useMemo<PaymentLite | null>(() => page.props.payment ?? req.payment ?? null, [page.props.payment, req.payment]);
  const refunds = useMemo<RefundLite[]>(() => page.props.refunds ?? [], [page.props.refunds]);

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
      <Head title={`Request #${req.id} — Admin`} />
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
                    href="/admin/requests"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <i className="fas fa-arrow-left" /> Kembali
                  </Link>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-gray-500">Admin</div>
                    <h1 className="text-lg font-semibold text-gray-900">Permintaan Servis #{req.id}</h1>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={req.status} />
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
                {/* LEFT: Detail & Messages */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Detail request */}
                  <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <h2 className="mb-3 text-base font-semibold text-gray-900">Detail Permintaan</h2>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-xs text-gray-500">Kategori</div>
                        <div className="font-medium text-gray-900">{categoryName(req.category, cats)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Dibuat</div>
                        <div className="font-medium text-gray-900">{fmtDateTime(req.created_at)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Jadwal</div>
                        <div className="font-medium text-gray-900">{fmtDateTime(req.scheduled_for)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Harga Disepakati</div>
                        <div className="font-medium text-gray-900">{req.accepted_price ? fmtPrice(req.accepted_price) : "-"}</div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-xs text-gray-500">Deskripsi</div>
                      <div className="whitespace-pre-wrap text-gray-800">{req.description ?? "-"}</div>
                    </div>
                  </section>

                  {/* User & Teknisi */}
                  <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <h2 className="mb-3 text-base font-semibold text-gray-900">Pihak Terkait</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-gray-100 p-3">
                        <div className="text-xs text-gray-500">User</div>
                        {req.user ? (
                          <>
                            <div className="font-semibold text-gray-900">{req.user.name}</div>
                            <div className="text-sm text-gray-700">{req.user.email}</div>
                            <div className="text-sm text-gray-700">{req.user.phone ?? "-"}</div>
                          </>
                        ) : (
                          <div className="text-gray-500">-</div>
                        )}
                      </div>
                      <div className="rounded-xl border border-gray-100 p-3">
                        <div className="text-xs text-gray-500">Teknisi</div>
                        {req.technician ? (
                          <>
                            <div className="font-semibold text-gray-900">{req.technician.name}</div>
                            <div className="text-sm text-gray-700">{req.technician.email}</div>
                            <div className="text-sm text-gray-700">{req.technician.phone ?? "-"}</div>
                          </>
                        ) : (
                          <div className="text-gray-500">Belum ditetapkan</div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Foto */}
                  <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-base font-semibold text-gray-900">Foto Permintaan</h2>
                      <div className="text-xs text-gray-500">{photos.length} foto</div>
                    </div>
                    {photos.length === 0 ? (
                      <div className="text-sm text-gray-500">Tidak ada foto.</div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {photos.map((p) => (
                          <a
                            key={p.id}
                            href={p.path}
                            target="_blank"
                            rel="noreferrer"
                            className="group block overflow-hidden rounded-xl border border-gray-100"
                            title="Buka gambar"
                          >
                            <img
                              src={p.path}
                              alt="Foto permintaan"
                              className="h-28 w-full object-cover transition group-hover:scale-[1.02]"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Pesan/Chat (read-only) */}
                  <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <h2 className="mb-3 text-base font-semibold text-gray-900">Riwayat Chat</h2>
                    {messages.length === 0 ? (
                      <div className="text-sm text-gray-500">Belum ada pesan.</div>
                    ) : (
                      <div className="max-h-[420px] overflow-auto rounded-xl border border-gray-100 p-3">
                        {messages.map((m) => {
                          // sisi kanan bila pengirim teknisi; kiri bila user; system pakai style khusus
                          const who: "user" | "teknisi" | "system" =
                            m.type === "system"
                              ? "system"
                              : (m.sender?.id === req.technician_id ? "teknisi" : "user");
                          const isMine = who === "teknisi"; // arbitrary untuk alignment
                          return <Bubble key={m.id} msg={m} isMine={isMine} who={who} />;
                        })}
                      </div>
                    )}
                  </section>
                </div>

                {/* RIGHT: Timeline & Payment */}
                <div className="space-y-4">
                  <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <h2 className="mb-3 text-base font-semibold text-gray-900">Timeline Status</h2>
                    <Timeline
                      current={req.status}
                      createdAt={req.created_at}
                      scheduledFor={req.scheduled_for}
                      paidAt={payment?.paid_at ?? null}
                    />
                  </section>

                  <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-base font-semibold text-gray-900">Pembayaran</h2>
                      {payment && <PayBadge status={payment.status} />}
                    </div>

                    {payment ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Jumlah</span>
                          <span className="font-semibold">{fmtPrice(payment.amount)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Provider</span>
                          <span className="font-medium">{payment.provider ?? "-"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Ref</span>
                          <span className="font-mono text-xs">{payment.provider_ref ?? "-"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Dibayar</span>
                          <span className="font-medium">{fmtDateTime(payment.paid_at)}</span>
                        </div>
                        {payment.snap_redirect_url && (
                          <div className="pt-2">
                            <a
                              href={payment.snap_redirect_url}
                              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                              target="_blank"
                              rel="noreferrer"
                            >
                              <i className="fas fa-external-link-alt" /> Buka Snap
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Belum ada pembayaran.</div>
                    )}
                  </section>

                  <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <h2 className="mb-3 text-base font-semibold text-gray-900">Refund</h2>
                    {refunds.length === 0 ? (
                      <div className="text-sm text-gray-500">Tidak ada refund.</div>
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {refunds.map((r) => (
                          <li key={r.id} className="rounded-xl border border-gray-100 p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{fmtPrice(r.amount)}</div>
                                <div className="text-xs text-gray-500">{r.reason ?? "-"}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs uppercase tracking-wide text-gray-500">{r.status}</div>
                                <div className="text-xs text-gray-500">{fmtDateTime(r.refunded_at)}</div>
                              </div>
                            </div>
                            {r.provider_ref && <div className="mt-1 text-[11px] text-gray-500">Ref: {r.provider_ref}</div>}
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
