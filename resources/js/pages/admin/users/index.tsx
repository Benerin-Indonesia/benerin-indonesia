import React, { useEffect, useMemo, useState } from "react";
import { Head, Link, useForm, usePage, router } from "@inertiajs/react";

/* =========================================
   Types
========================================= */
type Role = "user" | "technician" | "teknisi" | "admin";

type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
};

type PageProps = {
  auth?: { user?: { name?: string } };
  users?: { data: User[] } | User[];
  filters?: { q?: string; role?: string };
};

const ROLE_LABEL: Record<Role, string> = {
  user: "User",
  technician: "Teknisi",
  teknisi: "Teknisi",
  admin: "Admin",
};

/* =========================================
   Sidebar Nav
========================================= */
const NAV = [
  { href: "/admin/dashboard", icon: "fa-tachometer-alt", label: "Dashboard" },
  { href: "/admin/requests", icon: "fa-clipboard-list", label: "Service Requests" },
  { href: "/admin/payments", icon: "fa-receipt", label: "Payments" },
  { href: "/admin/payouts", icon: "fa-hand-holding-usd", label: "Payouts" },
  { href: "/admin/balances", icon: "fa-balance-scale", label: "Balances" },
  { href: "/admin/users", icon: "fa-users", label: "Users" },
  { href: "/admin/technician-services", icon: "fa-tools", label: "Technician Services" },
  { href: "/admin/categories", icon: "fa-tags", label: "Categories" },
];

/* =========================================
   UI bits
========================================= */
function RoleBadge({ role }: { role: Role }) {
  const cls =
    role === "admin"
      ? "bg-gray-900 text-white"
      : role === "technician" || role === "teknisi"
      ? "bg-blue-50 text-blue-700"
      : "bg-gray-100 text-gray-700";
  return <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${cls}`}>{ROLE_LABEL[role]}</span>;
}

export default function AdminUsersIndex() {
  const page = usePage<PageProps>();
  const currentUrl = page.url || "";
  const { users, filters, auth } = page.props;

  /* ===== Sidebar state ===== */
  const [sidebarOpen, setSidebarOpen] = useState(false);      // mobile drawer
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // desktop mini-rail

  // ESC tutup drawer mobile
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSidebarOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ===== Dummy data fallback ===== */
  const items: User[] = useMemo(() => {
    if (Array.isArray(users)) return users;
    if (users?.data) return users.data;
    return [
      { id: 1, name: "Agus Saputra", email: "agus@example.com", role: "user", phone: "0812-1111-2222" },
      { id: 2, name: "Nina Rahma", email: "nina@example.com", role: "technician", phone: "0813-3333-4444" },
      { id: 3, name: "Admin Satu", email: "admin@example.com", role: "admin" },
    ];
  }, [users]);

  /* ===== Filters ===== */
  const filterForm = useForm({
    q: filters?.q ?? "",
    role: filters?.role ?? "",
  });

  const submitFilter: React.FormEventHandler = (e) => {
    e.preventDefault();
    router.get("/admin/users", filterForm.data, { preserveState: true, replace: true });
  };

  /* ===== Delete ===== */
  const delForm = useForm({});
  const onDelete = (u: User) => {
    if (!confirm(`Hapus user "${u.name}"?`)) return;
    delForm.delete(`/admin/users/${u.id}`, { preserveScroll: true });
  };

  /* ===== Helpers ===== */
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
      <Head title="Users — Admin" />
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* ===== Overlay (mobile) ===== */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px] md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* ===== Sidebar ===== */}
          <aside
            aria-label="Admin sidebar"
            className={[
              "fixed inset-y-0 left-0 z-40 border-r border-gray-100 bg-white transition-transform duration-300",
              "w-72 p-4 md:p-3",
              sideWidth,
              sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            ].join(" ")}
          >
            {/* Header brand + Main Menu button */}
            <div className={`mb-4 flex items-center ${sidebarCollapsed ? "justify-center" : "justify-between"}`}>
              {!sidebarCollapsed ? (
                <div className="flex items-center gap-2">
                  {/* Logo disembunyikan saat collapsed */}
                  <img src="/storage/assets/logo.png" alt="Benerin Indonesia" className="h-8 w-auto" />
                </div>
              ) : (
                <span className="sr-only">Sidebar collapsed</span>
              )}

              {/* Main Menu button */}
              <button
                onClick={() => {
                  if (window.innerWidth < 768) setSidebarOpen(false);
                  else setSidebarCollapsed((v) => !v);
                }}
                className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                aria-label="Main Menu"
                title="Main Menu"
              >
                <i className={`fas ${sidebarCollapsed ? "fa-angle-double-right" : "fa-angle-double-left"}`} />
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

            {/* Footer mini di sidebar */}
            <div className="mt-6 border-t border-gray-100 pt-4 text-center text-xs text-gray-500">
              {!sidebarCollapsed && <>© {new Date().getFullYear()} Benerin Indonesia</>}
              {sidebarCollapsed && <span className="block text-[10px]">© {new Date().getFullYear()}</span>}
            </div>
          </aside>

          {/* ===== Content ===== */}
          <div className={`flex min-h-screen w-full flex-col ${contentPadLeft}`}>
            {/* ===== Header — sama seperti dashboard ===== */}
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

                  {/* Breadcrumb / title */}
                  <div>
                    <div className="text-xs uppercase tracking-wider text-gray-500">Admin</div>
                    <h1 className="text-lg font-semibold text-gray-900">Users</h1>
                  </div>
                </div>

                {/* Right tools */}
                <div className="flex items-center gap-2">
                  <div className="hidden sm:block">
                    <div className="relative">
                      <i className="fas fa-search pointer-events-none absolute left-3 top-2.5 text-sm text-gray-400" />
                      <input
                        type="text"
                        placeholder="Cari…"
                        className="w-56 rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-gray-900/20"
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

            {/* ===== Main ===== */}
            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {/* Toolbar: Tambah User di atas filter */}
              <div className="mb-3 flex justify-end">
                <Link
                  href="/admin/users/create"
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110"
                >
                  <i className="fas fa-user-plus" />
                  Tambah User
                </Link>
              </div>

              {/* Filter */}
              <form onSubmit={submitFilter} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Cari</label>
                    <div className="relative">
                      <i className="fas fa-search pointer-events-none absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        value={filterForm.data.q}
                        onChange={(e) => filterForm.setData("q", e.target.value)}
                        placeholder="Nama atau email…"
                        className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Role</label>
                    <select
                      value={filterForm.data.role}
                      onChange={(e) => filterForm.setData("role", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                    >
                      <option value="">Semua</option>
                      <option value="user">User</option>
                      <option value="technician">Teknisi</option>
                      <option value="teknisi">Teknisi</option>
                      <option value="admin">Admin</option>
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
                    href="/admin/users"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                    preserveState
                    replace
                  >
                    <i className="fas fa-undo" /> Reset
                  </Link>
                </div>
              </form>

              {/* Tabel */}
              <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="py-2 pr-3">Nama</th>
                        <th className="py-2 pr-3">Email</th>
                        <th className="py-2 pr-3">Role</th>
                        <th className="py-2 pr-3">Phone</th>
                        <th className="py-2 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((u) => (
                        <tr key={u.id} className="text-gray-800">
                          <td className="py-2 pr-3 font-medium">{u.name}</td>
                          <td className="py-2 pr-3">{u.email}</td>
                          <td className="py-2 pr-3">
                            <RoleBadge role={u.role} />
                          </td>
                          <td className="py-2 pr-3">{u.phone ?? "-"}</td>
                          <td className="py-2">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/admin/users/${u.id}/edit`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                              >
                                <i className="fas fa-edit" /> Edit
                              </Link>
                              <button
                                type="button"
                                onClick={() => onDelete(u)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                              >
                                <i className="fas fa-trash" /> Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {items.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                            Tidak ada data.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {/* (Opsional) Pagination di sini */}
              </div>
            </main>

            {/* ===== Footer ===== */}
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
