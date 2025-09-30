import React, { useState } from "react";
import { Head, Link, usePage, useForm } from "@inertiajs/react";

const PRIMARY = "#206BB0";

export default function Show() {
    const { props } = usePage();
    const { request } = props;

    // State input chat
    const [newMessage, setNewMessage] = useState("");

    // State pesan chat (dummy)
    const [messages, setMessages] = useState([
        { id: 1, from: "user", text: "Halo teknisi, bisa datang jam 10?" },
        { id: 2, from: "teknisi", text: "Bisa kak, saya otw ya." },
    ]);

    // Form inertia (untuk accept/reject)
    const { post, processing } = useForm({});

    // Modal konfirmasi aksi
    const [actionType, setActionType] = useState<"accept" | "reject" | null>(null);

    // === CHAT handler ===
    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        setMessages([
            ...messages,
            { id: messages.length + 1, from: "teknisi", text: newMessage },
        ]);
        setNewMessage("");
    };

    // === Konfirmasi aksi (Terima/Tolak) ===
    const handleConfirm = () => {
        if (!actionType) return;

        const url =
            actionType === "accept"
                ? `/user/permintaan/${request.id}/accept-price`
                : `/user/permintaan/${request.id}/reject-price`;

        post(url, {
            preserveScroll: true,
            onSuccess: () => {
                setActionType(null); // Tutup modal
            },
            onError: (err) => {
                console.error(err);
            },
        });
    };

    // === Helper ===
    function formatRupiah(angka: number | string | null) {
        if (angka === null || angka === undefined) return "Belum ditetapkan Teknisi";
        const number = parseFloat(angka as string);
        if (isNaN(number)) return "Belum ditetapkan Teknisi";
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(number);
    }

    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    }

    return (
        <>
            <Head title={`Detail Permintaan #${request.id}`} />

            <main className="mt-12 mx-auto max-w-7xl">
                {/* Header */}
                <div className="flex flex-col gap-3 border-b border-gray-200 bg-white px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-12">
                    <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                        Detail Permintaan Servis
                    </h1>
                    <Link
                        href="/user/dashboard"
                        className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50"
                    >
                        ← Kembali
                    </Link>
                </div>

                {/* Layout 2 kolom */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Detail Permintaan */}
                    <div className="flex flex-col h-full col-span-2 bg-white border rounded-lg shadow-sm px-6 py-8 sm:px-12">
                        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    Judul Permintaan
                                </dt>
                                <dd className="mt-1 text-base font-semibold text-gray-900">
                                    {request.title}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    Kategori
                                </dt>
                                <dd className="mt-1 text-base font-semibold text-gray-900">
                                    {request.category}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    Deskripsi
                                </dt>
                                <dd className="mt-1 text-base text-gray-900 whitespace-pre-line">
                                    {request.description}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    Jadwal Permintaan Service
                                </dt>
                                <dd className="mt-1 text-base font-semibold text-gray-900">
                                    {request.scheduled_for
                                        ? formatDate(request.scheduled_for)
                                        : "-"}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-gray-500">Status</dt>
                                <dd className="mt-1">
                                    <span
                                        className={`inline-flex items-center rounded-lg px-3 py-1 text-sm font-semibold ${request.status === "selesai"
                                            ? "bg-green-100 text-green-700"
                                            : request.status === "diproses"
                                                ? "bg-blue-100 text-blue-700"
                                                : request.status === "dijadwalkan"
                                                    ? "bg-orange-100 text-orange-700"
                                                    : request.status === "dibatalkan"
                                                        ? "bg-gray-200 text-gray-600"
                                                        : "bg-gray-100 text-gray-700"
                                            }`}
                                    >
                                        {request.status === "dijadwalkan"
                                            ? "Menunggu pembayaran"
                                            : request.status || "Menunggu"}
                                    </span>
                                </dd>
                            </div>


                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    {!request.accepted_price
                                        ? "Harga Penawaran"
                                        : request.status === "diproses"
                                            ? "Lunas"
                                            : request.status === "dijadwalkan"
                                                ? "Harus dibayar"
                                                : "Harga Penawaran"}
                                </dt>
                                <dd className="mt-1">
                                    <span
                                        className={`inline-flex items-center rounded-lg px-3 py-1 text-sm font-semibold ${request.accepted_price
                                            ? "bg-green-100 text-green-700"
                                            : "bg-orange-100 text-orange-700"
                                            }`}
                                    >
                                        {formatRupiah(request.accepted_price)}
                                    </span>
                                </dd>
                            </div>
                        </dl>

                        {/* Tombol aksi */}
                        <div className="mt-auto flex gap-3 pt-6">
                            <div className="flex gap-3 pt-6">
                                {request.status === "menunggu" && request.accepted_price !== null && (
                                    <>
                                        {/* Tombol Terima */}
                                        <button
                                            onClick={() => setActionType("accept")}
                                            className="inline-flex items-center gap-2 cursor-pointer rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow transition-colors duration-150 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                                        >
                                            <i className="fas fa-check-circle"></i>
                                            Terima Penawaran
                                        </button>

                                        {/* Tombol Tolak */}
                                        <button
                                            onClick={() => setActionType("reject")}
                                            className="inline-flex items-center gap-2 cursor-pointer rounded-xl border border-red-700 bg-transparent px-5 py-2 text-sm font-semibold text-red-700 shadow-sm transition-colors duration-150 hover:bg-red-700/10 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                        >
                                            <i className="fas fa-times-circle"></i>
                                            Tolak Penawaran
                                        </button>
                                    </>
                                )}

                                {request.status === "dijadwalkan" && (
                                    <button
                                        onClick={() => console.log("Bayar")}
                                        className="inline-flex cursor-pointer items-center gap-2 rounded-sm bg-[#206BB0] px-5 py-2 text-sm font-semibold text-white shadow transition-colors duration-150 hover:bg-[#206BB0] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    >
                                        <i className="fas fa-credit-card"></i>
                                        Bayar
                                    </button>
                                )}

                                {request.status === "diproses" && (
                                    <button
                                        disabled
                                        className="inline-flex items-center gap-2 rounded-xl bg-gray-400 px-5 py-3 text-sm font-semibold text-white shadow cursor-not-allowed"
                                    >
                                        <i className="fas fa-tools"></i>
                                        Sedang berlangsung
                                    </button>
                                )}

                                {request.status === "selesai" && (
                                    <button
                                        disabled
                                        className="inline-flex items-center gap-2 rounded-xl bg-gray-500 px-5 py-2 text-sm font-semibold text-white shadow cursor-not-allowed"
                                    >
                                        <i className="fas fa-check-double"></i>
                                        Layanan Anda sudah selesai
                                    </button>
                                )}

                                {request.status === "dibatalkan" && (
                                    <button
                                        disabled
                                        className="inline-flex items-center gap-2 rounded-xl bg-gray-300 px-5 py-2 text-sm font-semibold text-gray-600 shadow cursor-not-allowed"
                                    >
                                        <i className="fas fa-ban"></i>
                                        Layanan dibatalkan (Maintenance)
                                    </button>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* Panel Chat */}
                    <div className="col-span-1 border rounded-lg overflow-hidden flex flex-col gap-6">
                        <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col h-auto lg:h-full">
                            <h2 className="text-base font-semibold text-gray-800 mb-3">
                                💬 Chat dengan Pelanggan
                            </h2>
                            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.from === "teknisi"
                                            ? "justify-end"
                                            : "justify-start"
                                            }`}
                                    >
                                        <span
                                            className={`px-3 py-2 rounded-xl text-sm shadow ${msg.from === "teknisi"
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-200 text-gray-900"
                                                }`}
                                        >
                                            {msg.text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <form
                                onSubmit={handleSend}
                                className="mt-3 flex items-center gap-2"
                            >
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Tulis pesan..."
                                />
                                <button
                                    type="submit"
                                    className="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm"
                                    style={{ backgroundColor: PRIMARY }}
                                >
                                    ➤
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal Konfirmasi */}
            {actionType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                            {actionType === "accept"
                                ? "Terima Penawaran Harga"
                                : "Tolak Penawaran Harga"}
                        </h2>
                        <p className="text-sm text-gray-600 mb-6">
                            Apakah Anda yakin ingin{" "}
                            {actionType === "accept"
                                ? "menerima"
                                : "menolak"}{" "}
                            penawaran harga ini?
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setActionType(null)}
                                className="px-4 py-2 rounded-lg cursor-pointer border text-gray-700 hover:bg-gray-100"
                                disabled={processing}
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={processing}
                                className={`px-4 py-2 rounded-lg cursor-pointer font-semibold text-white ${actionType === "accept"
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : "bg-red-600 hover:bg-red-700"
                                    }`}
                            >
                                {processing ? "Memproses..." : "Ya, Lanjutkan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
