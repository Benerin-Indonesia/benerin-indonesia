import React, { useEffect, useMemo, useState } from "react";
import { Head, Link, useForm, usePage, router } from "@inertiajs/react";

/* =========================================
   Types & helpers
========================================= */
type Role = "user" | "teknisi" | "admin";

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

type PaginationLink = { url: string | null; label: string; active: boolean };

type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links?: PaginationLink[];
};

type PageProps = {
  auth?: { user?: { name?: string } };
  users?: Paginated<User> | User[];
  filters?: { q?: string; role?: string; perPage?: number };
};

const ROLE_LABEL: Record<Role, string> = {
  user: "User",
  teknisi: "Teknisi",
  admin: "Admin",
};

function isPaginatedUsers(u: PageProps["users"]): u is Paginated<User> {
  return (
    typeof u === "object" &&
    u !== null &&
    !Array.isArray(u) &&
    Array.isArray((u as Paginated<User>).data) &&
    typeof (u as Paginated<User>).current_page === "number"
  );
}

/* =========================================
   Small UI building blocks
========================================= */
function RoleBadge({ role }: { role: Role }) {
  const cls =
    role === "admin"
      ? "bg-gray-900 text-white"
      : role === "teknisi"
      ? "bg-blue-50 text-blue-700"
      : "bg-gray-100 text-gray-700";
  return (
    <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${cls}`}>
      {ROLE_LABEL[role]}
    </span>
  );
}

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
   Reusable Bank Fields
========================================= */
function BankFields<T extends { bank_name: string; account_name: string; account_number: string }>({
  form,
  legend,
  disabled = false,
}: {
  form: { data: T; setData: <K extends keyof T>(key: K, value: T[K]) => void; errors?: Record<string, string | undefined> };
  legend: string;
  disabled?: boolean;
}) {
  const ro = (d: boolean) =>
    `w-full rounded-xl border px-3 py-2 text-sm outline-none ${
      d ? "bg-gray-50 border-gray-200 text-gray-700" : "bg-white border-gray-200 focus:ring-2 focus:ring-gray-900/20"
    }`;

  return (
    <fieldset className="rounded-xl border border-gray-100 p-4">
      <legend className="px-2 text-sm font-semibold text-gray-900">{legend}</legend>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-800">Bank</label>
          <input
            type="text"
            value={form.data.bank_name}
            onChange={(e) => form.setData("bank_name", e.target.value as T[keyof T])}
            disabled={disabled}
            className={ro(disabled)}
            placeholder="BCA/BNI/BRI/…"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-800">Nama Pemilik</label>
          <input
            type="text"
            value={form.data.account_name}
            onChange={(e) => form.setData("account_name", e.target.value as T[keyof T])}
            disabled={disabled}
            className={ro(disabled)}
            placeholder="Nama di buku tabungan"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-800">No. Rekening</label>
          <input
            type="text"
            value={form.data.account_number}
            onChange={(e) => form.setData("account_number", e.target.value as T[keyof T])}
            disabled={disabled}
            className={ro(disabled)}
            placeholder="1234567890"
          />
        </div>
      </div>
    </fieldset>
  );
}

/* =========================================
   Pagination (bawah tabel, gaya Filament)
========================================= */
function Pagination({
  meta,
  filters,
}: {
  meta: Pick<Paginated<User>, "current_page" | "last_page" | "per_page" | "total">;
  filters?: { q?: string; role?: string; perPage?: number };
}) {
  if (!meta || meta.last_page <= 1) return null;

  const goTo = (page: number, perPage = meta.per_page) => {
    const params: Record<string, string | number> = { page, perPage };
    if (filters?.q) params.q = filters.q;
    if (filters?.role) params.role = filters.role;
    router.get("/admin/users", params, { preserveScroll: true, preserveState: true });
  };

  const changePerPage = (pp: number) => {
    const params: Record<string, string | number> = { page: 1, perPage: pp };
    if (filters?.q) params.q = filters.q;
    if (filters?.role) params.role = filters.role;
    router.get("/admin/users", params, { preserveScroll: true, preserveState: true });
  };

  // Buat daftar halaman ala Filament: 1 … (cur-2..cur+2) … last
  const pages: Array<number | string> = (() => {
    const total = meta.last_page;
    const cur = meta.current_page;
    const delta = 2;
    const arr: number[] = [1];
    for (let i = cur - delta; i <= cur + delta; i++) {
      if (i > 1 && i < total) arr.push(i);
    }
    if (total > 1) arr.push(total);
    const out: Array<number | string> = [];
    let prev: number | null = null;
    for (const n of [...new Set(arr)].sort((a, b) => a - b)) {
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
        Menampilkan <span className="font-medium text-gray-700">{from}</span> –
        <span className="font-medium text-gray-700"> {to} </span> dari{" "}
        <span className="font-medium text-gray-700">{meta.total}</span> data
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        {/* Per page */}
        <div className="inline-flex items-center gap-2">
          <select
            value={meta.per_page}
            onChange={(e) => changePerPage(Number(e.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-800"
            aria-label="Jumlah data per halaman"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-500">per page</span>
        </div>

        {/* Pager */}
        <ul className="inline-flex select-none items-center gap-1">
          <li>
            <button
              type="button"
              disabled={meta.current_page <= 1}
              onClick={() => goTo(meta.current_page - 1)}
              className="min-w-[2.25rem] rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50 disabled:text-gray-300"
              aria-label="Sebelumnya"
            >
              ‹
            </button>
          </li>

          {pages.map((p, i) =>
            p === "…" ? (
              <li key={`dots-${i}`} className="px-2 text-sm text-gray-400">
                …
              </li>
            ) : (
              <li key={`p-${p}`}>
                <button
                  type="button"
                  aria-current={p === meta.current_page ? "page" : undefined}
                  onClick={() => goTo(p as number)}
                  className={[
                    "min-w-[2.25rem] rounded-lg border px-3 py-1.5 text-sm transition",
                    p === meta.current_page
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50",
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
              className="min-w-[2.25rem] rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50 disabled:text-gray-300"
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
   Create & Edit Forms (modal)
========================================= */
function CreateUserForm({ onDone }: { onDone: () => void }) {
  type CreateForm = {
    name: string;
    email: string;
    password: string;
    role: Role;
    phone: string;
    bank_name: string;
    account_name: string;
    account_number: string;
  };
  const form = useForm<CreateForm>({
    name: "",
    email: "",
    password: "",
    role: "user",
    phone: "",
    bank_name: "",
    account_name: "",
    account_number: "",
  });

  // Opsional: kosongkan rekening saat memilih admin
  useEffect(() => {
    if (form.data.role === "admin") {
      form.setData("bank_name", "");
      form.setData("account_name", "");
      form.setData("account_number", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.data.role]);

  const submit: React.FormEventHandler = (e) => {
    e.preventDefault();
    form.post("/admin/users", {
      preserveScroll: true,
      onSuccess: () => {
        form.reset();
        onDone();
        router.reload({ only: ["users"] });
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
            form.setData("name", e.target.value);
            if (form.errors.name) form.clearErrors("name");
          }}
          className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20 ${
            form.errors.name ? "border-red-300 ring-2 ring-red-200" : "border-gray-200"
          }`}
          placeholder="Nama lengkap"
          required
        />
        {form.errors.name && <p className="mt-1 text-xs text-red-600">{form.errors.name}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-800">Email</label>
        <input
          type="email"
          value={form.data.email}
          onChange={(e) => {
            form.setData("email", e.target.value);
            if (form.errors.email) form.clearErrors("email");
          }}
          className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20 ${
            form.errors.email ? "border-red-300 ring-2 ring-red-200" : "border-gray-200"
          }`}
          placeholder="user@example.com"
          required
        />
        {form.errors.email && <p className="mt-1 text-xs text-red-600">{form.errors.email}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-800">Password</label>
        <input
          type="password"
          value={form.data.password}
          onChange={(e) => {
            form.setData("password", e.target.value);
            if (form.errors.password) form.clearErrors("password");
          }}
          className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20 ${
            form.errors.password ? "border-red-300 ring-2 ring-red-200" : "border-gray-200"
          }`}
          placeholder="••••••••"
          required
        />
        {form.errors.password && <p className="mt-1 text-xs text-red-600">{form.errors.password}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-800">Role</label>
          <select
            value={form.data.role}
            onChange={(e) => form.setData("role", e.target.value as Role)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
          >
            <option value="user">User</option>
            <option value="teknisi">Teknisi</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-800">Phone (opsional)</label>
          <input
            type="tel"
            value={form.data.phone}
            onChange={(e) => form.setData("phone", e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20"
            placeholder="08xx-xxxx-xxxx"
          />
        </div>
      </div>

      {/* Tampilkan rekening untuk user & teknisi (sembunyikan untuk admin) */}
      {form.data.role !== "admin" && (
        <BankFields form={form} legend={`Data Rekening (${ROLE_LABEL[form.data.role]})`} />
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={form.processing}
          className={[
            "inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5",
            "text-sm font-semibold text-white shadow-sm",
            "transition-transform duration-150 ease-out",
            "hover:scale-[1.02] active:scale-95 hover:brightness-110",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          ].join(" ")}
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

function EditUserForm({ user, onDone }: { user: User; onDone: () => void }) {
  type EditForm = {
    name: string;
    email: string;
    role: Role;
    phone: string;
    password: string;
    bank_name: string;
    account_name: string;
    account_number: string;
  };
  const form = useForm<EditForm>({
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user?.phone ?? "",
    password: "",
    bank_name: user?.bank_name ?? "",
    account_name: user?.account_name ?? "",
    account_number: user?.account_number ?? "",
  });

  // Opsional: kosongkan rekening saat memilih admin
  useEffect(() => {
    if (form.data.role === "admin") {
      form.setData("bank_name", "");
      form.setData("account_name", "");
      form.setData("account_number", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.data.role]);

  const submit: React.FormEventHandler = (e) => {
    e.preventDefault();
    form.put(`/admin/users/${user.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        form.reset("password");
        onDone();
        router.reload({ only: ["users"] });
      },
    });
  };

  const onDelete = () => {
    if (!confirm(`Hapus user "${user.name}"?`)) return;
    form.delete(`/admin/users/${user.id}`, {
      onSuccess: () => {
        onDone();
        router.reload({ only: ["users"] });
      },
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">ID: #{user.id}</span>
        <button
          type="button"
          onClick={onDelete}
          className={[
            "inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700",
            "transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-95 hover:bg-red-50",
          ].join(" ")}
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
            form.setData("name", e.target.value);
            if (form.errors.name) form.clearErrors("name");
          }}
          className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20 ${
            form.errors.name ? "border-red-300 ring-2 ring-red-200" : "border-gray-200"
          }`}
          placeholder="Nama lengkap"
          required
        />
        {form.errors.name && <p className="mt-1 text-xs text-red-600">{form.errors.name}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-800">Email</label>
        <input
          type="email"
          value={form.data.email}
          onChange={(e) => {
            form.setData("email", e.target.value);
            if (form.errors.email) form.clearErrors("email");
          }}
          className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20 ${
            form.errors.email ? "border-red-300 ring-2 ring-red-200" : "border-gray-200"
          }`}
          placeholder="user@example.com"
          required
        />
        {form.errors.email && <p className="mt-1 text-xs text-red-600">{form.errors.email}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-800">Password (opsional)</label>
        <input
          type="password"
          value={form.data.password}
          onChange={(e) => {
            form.setData("password", e.target.value);
            if (form.errors.password) form.clearErrors("password");
          }}
          className={`w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20 ${
            form.errors.password ? "border-red-300 ring-2 ring-red-200" : "border-gray-200"
          }`}
          placeholder="Biarkan kosong jika tidak diubah"
        />
        {form.errors.password && <p className="mt-1 text-xs text-red-600">{form.errors.password}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-800">Role</label>
          <select
            value={form.data.role}
            onChange={(e) => form.setData("role", e.target.value as Role)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/20"
          >
            <option value="user">User</option>
            <option value="teknisi">Teknisi</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-800">Phone (opsional)</label>
          <input
            type="tel"
            value={form.data.phone}
            onChange={(e) => form.setData("phone", e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20"
            placeholder="08xx-xxxx-xxxx"
          />
        </div>
      </div>

      {/* Tampilkan rekening untuk user & teknisi (sembunyikan untuk admin) */}
      {form.data.role !== "admin" && (
        <BankFields form={form} legend={`Data Rekening (${ROLE_LABEL[form.data.role]})`} />
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={form.processing}
          className={[
            "inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5",
            "text-sm font-semibold text-white shadow-sm",
            "transition-transform duration-150 ease-out",
            "hover:scale-[1.02] active:scale-95 hover:brightness-110",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          ].join(" ")}
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
   PAGE: Users Index + Modals
========================================= */
export default function AdminUsersIndex() {
  const page = usePage<PageProps>();
  const currentUrl = page.url;
  const { auth, users, filters } = page.props;

  // Sidebar states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Modals
  const [openCreate, setOpenCreate] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  // ESC close sidebar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSidebarOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Data list
  const items: User[] = useMemo(() => {
    if (Array.isArray(users)) return users;
    if (isPaginatedUsers(users)) return users.data;
    // fallback sample
    return [
      { id: 1, name: "Agus Saputra", email: "agus@example.com", role: "user", phone: "0812-1111-2222" },
      { id: 2, name: "Nina Rahma", email: "nina@example.com", role: "teknisi", phone: "0813-3333-4444" },
      { id: 3, name: "Admin Satu", email: "admin@example.com", role: "admin" },
    ];
  }, [users]);

  // Meta pagination
  const meta = useMemo(() => {
    if (!isPaginatedUsers(users)) return null;
    const { current_page, last_page, per_page, total } = users;
    return { current_page, last_page, per_page, total };
  }, [users]);

  // Filters (pencarian)
  const filterForm = useForm({
    q: filters?.q ?? "",
    role: filters?.role ?? "",
  });
  const submitFilter: React.FormEventHandler = (e) => {
    e.preventDefault();
    router.get(
      "/admin/users",
      { ...filterForm.data, perPage: filters?.perPage ?? meta?.per_page ?? 10 },
      { preserveState: true, replace: true }
    );
  };

  // Delete row
  const delForm = useForm({});
  const onDeleteRow = (u: User) => {
    if (!confirm(`Hapus user "${u.name}"?`)) return;
    delForm.delete(`/admin/users/${u.id}`, { preserveScroll: true });
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
      only: ["users"],
      onFinish: () => setRefreshing(false),
      onError: () => setRefreshing(false),
    });
  };

  return (
    <>
      <Head title="Users" />
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Overlay mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px] md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
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
              {[
                { href: "/admin/dashboard", icon: "fa-tachometer-alt", label: "Dashboard" },
                { href: "/admin/requests", icon: "fa-clipboard-list", label: "Permintaan Servis" },
                { href: "/admin/payments", icon: "fa-receipt", label: "Pembayaran" },
                { href: "/admin/payouts", icon: "fa-hand-holding-usd", label: "Pencairan Dana" },
                { href: "/admin/balances", icon: "fa-balance-scale", label: "Saldo" },
                { href: "/admin/users", icon: "fa-users", label: "Users" },
                { href: "/admin/technician-services", icon: "fa-tools", label: "Layanan Teknisi" },
                { href: "/admin/categories", icon: "fa-tags", label: "Kategori" },
              ].map((it) => {
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
                    <h1 className="text-lg font-semibold text-gray-900">Users</h1>
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
                        refreshing ? "opacity-60 cursor-not-allowed" : "",
                      ].join(" ")}
                      title="Muat ulang data user"
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
                  <span className="hidden sm:inline">Kelola data pengguna sistem.</span>
                </div>
                <button
                  onClick={() => setOpenCreate(true)}
                  className={[
                    "inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5",
                    "text-sm font-semibold text-white shadow-sm",
                    "transition-transform duration-150 ease-out",
                    "hover:scale-[1.02] active:scale-95 hover:brightness-110",
                  ].join(" ")}
                >
                  <i className="fas fa-user-plus" />
                  Tambah User
                </button>
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
                      <option value="teknisi">Teknisi</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                  >
                    <i className="fas fa-filter" /> Terapkan
                  </button>
                  <Link
                    href="/admin/users"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
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
                              <button
                                type="button"
                                onClick={() => setEditUser(u)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:scale-[1.02] hover:bg-gray-50 active:scale-95"
                              >
                                <i className="fas fa-edit" /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteRow(u)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:scale-[1.02] hover:bg-red-50 active:scale-95"
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

                {/* Pagination di bawah tabel */}
                {meta && <Pagination meta={meta} filters={filters} />}
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
      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Tambah User" wide>
        <CreateUserForm onDone={() => setOpenCreate(false)} />
      </Modal>

      <Modal open={!!editUser} onClose={() => setEditUser(null)} title={`Edit User${editUser ? ` — ${editUser.name}` : ""}`} wide>
        {editUser && <EditUserForm user={editUser} onDone={() => setEditUser(null)} />}
      </Modal>
    </>
  );
}
