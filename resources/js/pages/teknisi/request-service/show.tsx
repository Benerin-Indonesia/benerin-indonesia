import React, { useState } from "react";
import { Head, Link, usePage, useForm } from "@inertiajs/react";

const PRIMARY = "#206BB0";

export default function Show() {
    const { props } = usePage();
    const { request } = props;

    // State untuk input chat
    const [newMessage, setNewMessage] = useState("");

    // State untuk modal harga
    const [showModal, setShowModal] = useState(false);

    // useForm untuk penawaran harga
    const { data, setData, post, processing, errors, reset } = useForm({
        offer_price: "",
        request_id: request.id,
    });

    // State dummy untuk chat
    const [messages, setMessages] = useState([

        {
            id: 1,
            from: "user",
            text: "Selamat malam, Pak. Mau tanya, apa bisa perbaiki mesin cuci?"
        },
        {
            id: 2,
            from: "teknisi",
            text: "Selamat malam. Bisa, Bu. Boleh dijelaskan kerusakannya seperti apa ya?"
        },
        {
            id: 3,
            from: "user",
            text: "Ini mesin cuci saya bagian pengeringnya tidak mau berputar, Pak. Hanya mengeluarkan suara mendengung saja."
        },
        {
            id: 4,
            from: "teknisi",
            text: "Baik. Kemungkinan itu ada masalah di kapasitor atau dinamo pengeringnya. Ibu lokasinya di mana ya? Biar saya bisa jadwalkan pengecekan."
        },
        {
            id: 5,
            from: "user",
            text: "Saya di daerah Laweyan, Pak. Tepatnya di Jl. Rajawali No. 40. Kira-kira kapan ya bisa datang?"
        },
        {
            id: 6,
            from: "teknisi",
            text: "Kebetulan besok pagi saya ada jadwal di dekat situ. Bagaimana kalau sekitar jam 10 pagi saya ke lokasi Ibu?"
        },
        {
            id: 7,
            from: "user",
            text: "Boleh, Pak. Besok jam 10 pagi saya ada di rumah. Untuk biaya pengecekannya berapa ya?"
        },
        {
            id: 8,
            from: "teknisi",
            text: "Untuk biaya pengecekan saja 75 ribu ya, Bu. Nanti kalau ada pergantian spare part, biayanya akan saya informasikan dulu sebelum pengerjaan."
        },
        {
            id: 9,
            from: "user",
            text: "Oke, setuju, Pak. Saya tunggu besok ya."
        },
        {
            id: 10,
            from: "teknisi",
            text: "Baik, Bu. Sampai bertemu besok."
        }

    ]);

    // Handle Submit
    const handleSubmitPrice = (e: React.FormEvent) => {
        e.preventDefault();

        post("/teknisi/permintaan-harga", {
            offer_price: data.offer_price,
            request_id: data.request_id,
            onSuccess: () => {
                reset(); // kosongkan form
                setShowModal(false);
            },
            onError: (errors) => {
                console.log(errors);
            },
        });
    };
    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        setMessages([
            ...messages,
            { id: messages.length + 1, from: "teknisi", text: newMessage },
        ]);
        setNewMessage("");
    };

    // Formater
    function formatRupiah(angka) {
        if (angka === null || angka === undefined) {
            return "Belum ditetapkan";
        }
        const number = parseFloat(angka);
        if (isNaN(number)) {
            return "Belum ditetapkan";
        }
        const formatter = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });

        return formatter.format(number);
    }
    function formatDate(dateString: string) {
        const date = new Date(dateString);
        // format: 30 Sep 2025, 22:33
        return date.toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false, // gunakan format 24 jam
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
                        href="/teknisi/dashboard"
                        className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50"
                    >
                        ← Kembali
                    </Link>
                </div>

                {/* Layout 2 kolom */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Detail Permintaan */}
                    <div className="flex flex-col col-span-2 bg-white border h-[50%] rounded-lg shadow-sm px-6 py-8 sm:px-12">
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
                                            ? "Menunggu pembayaran pelanggan"
                                            : request.status === "menunggu" &&
                                                request.accepted_price !== null &&
                                                request.accepted_price !== 0
                                                ? "Menunggu persetujuan harga pelanggan" : request.status || "Menunggu"}
                                    </span>
                                </dd>
                            </div>

                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    {!request.accepted_price ? "Tentukan Harga" : request.status === "selesai" ? "Lunas" : request.status === "dijadwalkan" ? "Harga" : "Harga"}
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

                        {/* Kondisi tombol untuk teknisi */}
                        <div className="flex gap-3 pt-6">
                            {/* 1. Status menunggu + harga kosong */}
                            {request.status === "menunggu" && (request.accepted_price === null || request.accepted_price === 0) && (
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
                                    style={{ backgroundColor: PRIMARY }}
                                >
                                    <i className="fas fa-paper-plane" />
                                    Buat Penawaran Harga
                                </button>
                            )}

                            {/* 2. Status menunggu + harga sudah ada */}
                            {request.status === "menunggu" && request.accepted_price !== null && request.accepted_price !== 0 && (
                                <button
                                    disabled
                                    className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold bg-gray-300 text-gray-600 cursor-not-allowed shadow-sm"
                                >
                                    <i className="fas fa-paper-plane" />
                                    Buat Penawaran Harga
                                </button>
                            )}

                            {/* 3. Status dijadwalkan */}
                            {/* {request.status === "dijadwalkan" && (
                                <button
                                    disabled
                                    className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold bg-gray-300 text-gray-600 cursor-not-allowed shadow-sm"
                                >
                                    <i className="fas fa-play-circle" />
                                    Mulai Kerjakan
                                </button>
                            )} */}

                            {/* {request.status === "diproses" && (
                                <button
                                    className="inline-flex items-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-semibold bg-green-700 text-white cursor-not-allowed shadow-sm"
                                >
                                    <i className="fas fa-play-circle" />
                                    Mulai Kerjakan
                                </button>
                            )} */}
                        </div>

                    </div>

                    {/* Panel Samping (Chat) */}
                    <div className="col-span-1 border rounded-lg overflow-hidden flex flex-col h-[50%] gap-6">
                        <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col h-[100%]">
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

            {/* Modal Pop-up */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center transition-opacity"
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
                >
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md animate-fade-in-up">
                        <h2 className="text-lg font-semibold mb-4">
                            Buat Penawaran Harga
                        </h2>
                        <form onSubmit={handleSubmitPrice} className="space-y-4">
                            <input
                                type="number"
                                value={data.offer_price}
                                onChange={(e) =>
                                    setData("offer_price", e.target.value)
                                }
                                placeholder="Masukkan harga"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {errors.offer_price && (
                                <p className="text-red-500 text-sm">
                                    {errors.offer_price}
                                </p>
                            )}
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 cursor-pointer rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 cursor-pointer rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                                >
                                    {processing ? "Menyimpan..." : "Simpan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
