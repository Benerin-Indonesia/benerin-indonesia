import React from "react";
import { Head, Link, useForm } from "@inertiajs/react";

const PRIMARY = "#206BB0";

// 1. Terima prop 'initialCategory' di sini
export default function Buat({ initialCategory, categories }) {

    // 2. Gunakan prop untuk nilai awal form
    const { data, setData, post, processing, errors } = useForm({
        category: initialCategory,
        title: "",
        description: "",
        scheduled_for: "",
        error_notif: ""
    });

    const submit = (e) => {
        e.preventDefault();
        post("/u/permintaan/simpan");
    };

    // const CATEGORIES = [
    //     { slug: "ac", name: "AC" },
    //     { slug: "tv", name: "TV" },
    //     { slug: "kulkas", name: "Kulkas" },
    //     { slug: "mesin-cuci", name: "Mesin Cuci" },
    // ];

    return (
        <>
            <Head title="Buat Permintaan Servis" />

            <main className="mt-12 mx-auto max-w-7xl">
                {/* Header */}
                <div className="flex flex-col gap-3 border-b border-gray-200 bg-white px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-12">
                    <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                        Buat Permintaan Servis
                    </h1>
                    <Link
                        href="/user/dashboard"
                        className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50"
                    >
                        ← Kembali
                    </Link>
                </div>

                {/* Error Alert */}
                {errors.error_notif && (
                    <div className="p-4 mb-4 mt-5 text-sm w-[93%] mx-auto text-red-800 font-bold bg-red-100 rounded-lg" role="alert">
                        {errors.error_notif}
                    </div>
                )}

                {/* Form */}
                <form
                    onSubmit={submit}
                    className="grid grid-cols-1 gap-6 bg-white px-6 py-8 shadow-sm sm:grid-cols-2 sm:px-12 lg:grid-cols-3"
                >
                    {/* Kategori */}
                    <div className="sm:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">
                            Kategori
                        </label>
                        <select
                            value={data.category}
                            onChange={(e) => setData("category", e.target.value)}
                            className="mt-2 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="">-- Pilih kategori --</option>
                            {categories.map((c) => (
                                <option key={c.slug} value={c.slug}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        {errors.category && (
                            <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                        )}
                    </div>

                    {/* Judul */}
                    <div className="sm:col-span-2 lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Judul Permintaan
                        </label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={(e) => setData("title", e.target.value)}
                            className="mt-2 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Contoh: AC tidak dingin"
                        />
                        {errors.title && (
                            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                        )}
                    </div>

                    {/* Deskripsi */}
                    <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-gray-700">
                            Deskripsi
                        </label>
                        <textarea
                            rows={5}
                            value={data.description}
                            onChange={(e) => setData("description", e.target.value)}
                            className="mt-2 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Ceritakan detail masalah perangkat Anda..."
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                        )}
                    </div>

                    {/* Jadwal */}
                    <div className="sm:col-span-1 lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">
                            Jadwal
                        </label>
                        <input
                            type="datetime-local"
                            value={data.scheduled_for}
                            onChange={(e) => setData("scheduled_for", e.target.value)}
                            className="mt-2 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        {errors.scheduled_for && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.scheduled_for}
                            </p>
                        )}
                    </div>

                    {/* Tombol Submit */}
                    <div className="sm:col-span-3 flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg disabled:opacity-50"
                            style={{ backgroundColor: PRIMARY }}
                        >
                            <i className="fas fa-paper-plane" /> Kirim Permintaan
                        </button>
                    </div>
                </form>
            </main>
        </>
    );
}