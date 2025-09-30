import React, { useEffect, useMemo, useState } from "react";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";

/* =========================================
   Types
========================================= */
type Category = {
  id: number;
  slug: string;
  name: string;
  icon?: string | null;
};

type Paginated<T> = { data: T[] };

type PageProps = {
  auth?: { user?: { name?: string } };
  categories?: Paginated<Category> | Category[];
  filters?: { q?: string };
};

/* =========================================
   Helpers
========================================= */
function isPaginatedCategories(
  c: PageProps["categories"]
): c is Paginated<Category> {
  return typeof c === "object" && c !== null && !Array.isArray(c) && Array.isArray((c as Paginated<Category>).data);
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/* =========================================
   Small UI
========================================= */
function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center px-4">
        <div
          className={`w-full ${wide ? "max-w-3xl" : "max-w-lg"} rounded-2xl border border-gray-100 bg-white shadow-xl`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              aria-label="Tutup"
            >
              <i className="fas fa-times" />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* =========================================
   Forms
========================================= */
function CreateCategoryForm({ onDone }: { onDone: () => void }) {
  type CreateForm = {
    name: string;
    slug: string;
    icon: string;
  };
  const form = useForm<CreateForm>({
    name: "",
    slug: "",
    icon: "",
  });

  const submit: React.FormEventHandler = (e) => {
    e.preventDefault();
    form.post("/admin/categories", {
      preserveScroll: true,
      onSuccess: () => {
        form.reset();
        onDone();
        router.reload({ only: ["categories"] });
      },
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-800">Nama</label>
        <input
          type="text"
          value={form.data.name}
          onChange={(e) => {
            const v = e.target.value;
            form.setData("name", v);
            if (!form.data.slug) form.setData("slug", slugify(v));
            if (form.errors.name) form.clearErrors("name");
          }}
          className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20 ${form.errors.name ? "border-red-300 ring-2 ring-red-200" : "border-gray-200"
            }`}
          placeholder="AC / TV / Kulkas / Mesin Cuci"
          required
        />
        {form.errors.name && <p className="mt-1 text-xs text-red-600">{form.errors.name}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-800">Slug</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={form.data.slug}
              onChange={(e) => form.setData("slug", slugify(e.target.value))}
              className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20 ${form.errors.slug ? "border-red-300 ring-2 ring-red-200" : "border-gray-200"
                }`}
              placeholder="ac / tv / kulkas / mesin-cuci"
              required
            />
            <button
              type="button"
              onClick={() => form.setData("slug", slugify(form.data.name))}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              title="Generate dari nama"
            >
              <i className="fas fa-magic" /> Buat
            </button>
          </div>
          {form.errors.slug && <p className="mt-1 text-xs text-red-600">{form.errors.slug}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-800">Icon (opsional)</label>
          <input
            type="text"
            value={form.data.icon}
            onChange={(e) => form.setData("icon", e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20"
            placeholder="emoji (🔧) atau nama file (ac.png)"
          />
          {form.errors.icon && <p className="mt-1 text-xs text-red-600">{form.errors.icon}</p>}
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={form.processing}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110"
        >
          {form.processing ? (
            <>
              <i className="fas fa-spinner fa-spin" /> Menyimpan…
            </>
          ) : (
            <>
              <i className="fas fa-save" /> Simpan
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function EditCategoryForm({ category, onDone }: { category: Category; onDone: () => void }) {
  type EditForm = { name: string; slug: string; icon: string };
  const form = useForm<EditForm>({
    name: category.name,
    slug: category.slug,
    icon: category.icon ?? "",
  });

  const submit: React.FormEventHandler = (e) => {
    e.preventDefault();
    form.put(`/admin/categories/${category.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        onDone();
        router.reload({ only: ["categories"] });
      },
    });
  };

  const onDelete = () => {
    if (!confirm(`Hapus kategori "${category.name}"?`)) return;
    form.delete(`/admin/categories/${category.id}`, {
      onSuccess: () => {
        onDone();
        router.reload({ only: ["categories"] });
      },
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">ID: #{category.id}</span>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
        >
          <i className="fas fa-trash" /> Hapus
        </button>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-800">Nama</label>
        <input
          type="text"
          value={form.data.name}
          onChange={(e) => {
            const v = e.target.value;
            form.setData("name", v);
            if (!form.data.slug || form.data.slug === category.slug) {
              form.setData("slug", slugify(v));
            }
          }}
          className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20 ${form.errors.name ? "border-red-300 ring-2 ring-red-200" : "border-gray-200"
            }`}
          placeholder="Nama kategori"
          required
        />
        {form.errors.name && <p className="mt-1 text-xs text-red-600">{form.errors.name}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-800">Slug</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={form.data.slug}
              onChange={(e) => form.setData("slug", slugify(e.target.value))}
              className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20 ${form.errors.slug ? "border-red-300 ring-2 ring-red-200" : "border-gray-200"
                }`}
              required
            />
            <button
              type="button"
              onClick={() => form.setData("slug", slugify(form.data.name))}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              title="Generate dari nama"
            >
              <i className="fas fa-magic" /> Buat
            </button>
          </div>
          {form.errors.slug && <p className="mt-1 text-xs text-red-600">{form.errors.slug}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-800">Icon (opsional)</label>
          <input
            type="text"
            value={form.data.icon}
            onChange={(e) => form.setData("icon", e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20"
            placeholder="emoji (🔧) atau nama file (ac.png)"
          />
          {form.errors.icon && <p className="mt-1 text-xs text-red-600">{form.errors.icon}</p>}
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={form.processing}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110"
        >
          {form.processing ? (
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
export default function AdminCategoriesIndex() {
  const page = usePage<PageProps>();
  const currentUrl = page.url;
  const { auth, categories, filters } = page.props;

  // Sidebar & modals
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [openCreate, setOpenCreate] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSidebarOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Data list
  const items: Category[] = useMemo(() => {
    if (Array.isArray(categories)) return categories;
    if (isPaginatedCategories(categories)) return categories.data;
    // fallback sample
    return [
      { id: 1, slug: "ac", name: "AC", icon: "❄️" },
      { id: 2, slug: "tv", name: "TV", icon: "📺" },
      { id: 3, slug: "kulkas", name: "Kulkas", icon: "🧊" },
      { id: 4, slug: "mesin-cuci", name: "Mesin Cuci", icon: "🧺" },
    ];
  }, [categories]);

  // Filter form
  const filterForm = useForm({ q: filters?.q ?? "" });
  const submitFilter: React.FormEventHandler = (e) => {
    e.preventDefault();
    router.get("/admin/categories", filterForm.data, { preserveState: true, replace: true });
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
      <Head title="Categories — Admin" />
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
                    <h1 className="text-lg font-semibold text-gray-900">Kategori</h1>
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

            {/* Main */}
            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {/* Actions: tombol tambah di atas main pencarian */}
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="hidden sm:inline">Kelola kategori servis yang tampil di aplikasi.</span>
                </div>
                <button
                  onClick={() => setOpenCreate(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110"
                >
                  <i className="fas fa-plus" />
                  Tambah Kategori
                </button>
              </div>

              {/* Filter (main pencarian) */}
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
                        placeholder="Nama atau slug…"
                        className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
                      />
                    </div>
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
                    href="/admin/categories"
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
                        <th className="py-2 pr-3">Nama</th>
                        <th className="py-2 pr-3">Slug</th>
                        <th className="py-2 pr-3">Icon</th>
                        <th className="py-2 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((c) => (
                        <tr key={c.id} className="text-gray-800">
                          <td className="py-2 pr-3 font-medium">{c.name}</td>
                          <td className="py-2 pr-3">{c.slug}</td>
                          <td className="py-2 pr-3">
                            {c.icon ? (
                              // jika emoji, tampilkan apa adanya; jika file, tampilkan nama file
                              <span className="inline-flex min-w-[2rem] items-center justify-center rounded-lg border border-gray-200 px-2 py-1">
                                {c.icon}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="py-2">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditItem(c)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                              >
                                <i className="fas fa-edit" /> Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {items.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-sm text-gray-500">
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

      {/* Modals */}
      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Tambah Kategori" wide>
        <CreateCategoryForm onDone={() => setOpenCreate(false)} />
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title={`Edit Kategori${editItem ? ` — ${editItem.name}` : ""}`} wide>
        {editItem && <EditCategoryForm category={editItem} onDone={() => setEditItem(null)} />}
      </Modal>
    </>
  );
}
