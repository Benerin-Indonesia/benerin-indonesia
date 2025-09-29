import React, { useEffect, useMemo, useState } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";

/* ========= Types ========= */
type Role = "user" | "technician" | "teknisi" | "admin";
type RoleNormalized = "user" | "technician" | "admin";

type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  bank_name?: string | null;
  account_name?: string | null;
  account_number?: string | null;
};

type PageProps = { auth?: { user?: { name?: string } }; user?: User };

/* ========= Sidebar Nav ========= */
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

/* ========= Helpers ========= */
function toRoleNormalized(v: string): RoleNormalized {
  if (v === "teknisi") return "technician";
  if (v === "user" || v === "technician" || v === "admin") return v;
  return "user";
}

export default function AdminUsersEdit() {
  const { props, url } = usePage<PageProps>();
  const { auth } = props;
  const currentUrl: string = url;

  /* ===== Sidebar state ===== */
  const [sidebarOpen, setSidebarOpen] = useState(false);           // mobile drawer
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // desktop mini-rail
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSidebarOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) => currentUrl.startsWith(href);
  const navItemCls = (active: boolean, collapsed: boolean) =>
    [
      "flex items-center rounded-xl px-3 py-2 text-sm font-medium transition",
      active ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-50",
      collapsed ? "justify-center" : "gap-3",
    ].join(" ");
  const sideWidth = sidebarCollapsed ? "md:w-20" : "md:w-72";
  const contentPadLeft = sidebarCollapsed ? "md:pl-20" : "md:pl-72";

  /* ===== Data user (dummy fallback) ===== */
  const u: User = useMemo(
    () =>
      props.user ?? {
        id: 1,
        name: "Agus Saputra",
        email: "agus@example.com",
        role: "user",
        phone: "0812-1111-2222",
        bank_name: null,
        account_name: null,
        account_number: null,
      },
    [props.user]
  );

  // Normalisasi role lama 'teknisi' -> 'technician' tanpa "any"
  const normalizedRole: RoleNormalized = u.role === "teknisi" ? "technician" : u.role;

  /* ===== Form ===== */
  type EditForm = {
    name: string;
    email: string;
    role: RoleNormalized;
    phone: string;
    password: string; // opsional; kosong = tidak ganti
    bank_name: string;
    account_name: string;
    account_number: string;
  };

  const {
    data,
    setData,
    put,
    processing,
    errors,
    clearErrors,
    delete: destroy,
    reset,
  } = useForm<EditForm>({
    name: u.name,
    email: u.email,
    role: normalizedRole,
    phone: u.phone ?? "",
    password: "",
    bank_name: u.bank_name ?? "",
    account_name: u.account_name ?? "",
    account_number: u.account_number ?? "",
  });

  const submit: React.FormEventHandler = (e) => {
    e.preventDefault();
    // data.role sudah normalized (RoleNormalized), tidak perlu mengirim opsi 'data' ke put()
    put(`/admin/users/${u.id}`, {
      onSuccess: () => reset("password"),
    });
  };

  const onDelete = () => {
    if (!confirm(`Hapus user "${u.name}"?`)) return;
    destroy(`/admin/users/${u.id}`);
  };

  return (
    <>
      <Head title={`Edit User — ${u.name}`} />
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
            {/* Brand + Main Menu button */}
            <div className={`mb-4 flex items-center ${sidebarCollapsed ? "justify-center" : "justify-between"}`}>
              {!sidebarCollapsed ? (
                <div className="flex items-center gap-2">
                  <img src="/storage/assets/logo.png" alt="Benerin Indonesia" className="h-8 w-auto" />
                </div>
              ) : (
                <span className="sr-only">Sidebar collapsed</span>
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

            {/* Sidebar footer */}
            <div className="mt-6 border-t border-gray-100 pt-4 text-center text-xs text-gray-500">
              {!sidebarCollapsed && <>© {new Date().getFullYear()} Benerin Indonesia</>}
              {sidebarCollapsed && <span className="block text-[10px]">© {new Date().getFullYear()}</span>}
            </div>
          </aside>

          {/* ===== Content ===== */}
          <div className={`flex min-h-screen w-full flex-col ${contentPadLeft}`}>
            {/* ===== Header (seragam dgn dashboard) ===== */}
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
                    <h1 className="text-lg font-semibold text-gray-900">Edit User</h1>
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
            <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
              {/* Toolbar atas form */}
              <div className="mb-3 flex items-center justify-between">
                <Link
                  href="/admin/users"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                >
                  <i className="fas fa-arrow-left" /> Kembali
                </Link>
                <button
                  type="button"
                  onClick={onDelete}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  <i className="fas fa-trash" /> Hapus
                </button>
              </div>

              {/* Form */}
              <form onSubmit={submit} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm" noValidate>
                {/* Name */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-800">Nama</label>
                  <input
                    type="text"
                    value={data.name}
                    onChange={(e) => {
                      setData("name", e.target.value);
                      if (errors.name) clearErrors("name");
                    }}
                    className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20 ${
                      errors.name ? "border-red-300 ring-2 ring-red-200" : "border-gray-200"
                    }`}
                    placeholder="Nama lengkap"
                    required
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-800">Email</label>
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => {
                      setData("email", e.target.value);
                      if (errors.email) clearErrors("email");
                    }}
                    className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20 ${
                      errors.email ? "border-red-300 ring-2 ring-red-200" : "border-gray-200"
                    }`}
                    placeholder="user@example.com"
                    required
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>

                {/* Password (opsional) */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-800">Password (opsional)</label>
                  <input
                    type="password"
                    value={data.password}
                    onChange={(e) => {
                      setData("password", e.target.value);
                      if (errors.password) clearErrors("password");
                    }}
                    className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20 ${
                      errors.password ? "border-red-300 ring-2 ring-red-200" : "border-gray-200"
                    }`}
                    placeholder="Biarkan kosong jika tidak diubah"
                  />
                  {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                </div>

                {/* Role & Phone */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-800">Role</label>
                    <select
                      value={data.role}
                      onChange={(e) => setData("role", toRoleNormalized(e.target.value))}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                    >
                      <option value="user">User</option>
                      <option value="technician">Teknisi</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-800">Phone (opsional)</label>
                    <input
                      type="tel"
                      value={data.phone ?? ""}
                      onChange={(e) => setData("phone", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20"
                      placeholder="08xx-xxxx-xxxx"
                    />
                  </div>
                </div>

                {/* Data Rekening (wajib jika teknisi) */}
                {data.role === "technician" && (
                  <fieldset className="rounded-xl border border-gray-100 p-4">
                    <legend className="px-2 text-sm font-semibold text-gray-900">Data Rekening (teknisi)</legend>
                    <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-800">Bank</label>
                        <input
                          type="text"
                          value={data.bank_name ?? ""}
                          onChange={(e) => setData("bank_name", e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20"
                          placeholder="BCA/BNI/BRI/…"
                        />
                        {errors.bank_name && <p className="mt-1 text-xs text-red-600">{errors.bank_name}</p>}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-800">Nama Pemilik</label>
                        <input
                          type="text"
                          value={data.account_name ?? ""}
                          onChange={(e) => setData("account_name", e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20"
                          placeholder="Nama di buku tabungan"
                        />
                        {errors.account_name && <p className="mt-1 text-xs text-red-600">{errors.account_name}</p>}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-800">No. Rekening</label>
                        <input
                          type="text"
                          value={data.account_number ?? ""}
                          onChange={(e) => setData("account_number", e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20"
                          placeholder="1234567890"
                        />
                        {errors.account_number && <p className="mt-1 text-xs text-red-600">{errors.account_number}</p>}
                      </div>
                    </div>
                  </fieldset>
                )}

                {/* Actions */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110"
                  >
                    {processing ? (
                      <>
                        <i className="fas fa-spinner fa-spin" /> Menyimpan…
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save" /> Simpan Perubahan
                      </>
                    )}
                  </button>
                </div>
              </form>
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
