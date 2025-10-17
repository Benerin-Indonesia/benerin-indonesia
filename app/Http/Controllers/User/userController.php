<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Payment;
use App\Models\Refund;
use App\Models\ServiceRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'user') abort(403);

        $user_id = $user->id;

        // $categories = Category::select('id', 'slug', 'name', 'icon', 'hint')->limit(4)->get();
        $categories = Category::select('id', 'slug', 'name', 'icon')->get(); // NO LIMIT

        $tasks = [
            'active' => ServiceRequest::where('user_id', $user_id)
                ->where('status', 'menunggu')
                ->count(),
            'scheduled' => ServiceRequest::where('user_id', $user_id)
                ->where('status', 'diproses')
                ->count(),
            'completed' => ServiceRequest::where('user_id', $user_id)
                ->where('status', 'selesai')
                ->count(),
        ];

        $request_items = ServiceRequest::where('user_id', $user_id)
            ->whereIn('status', ['menunggu', 'diproses', 'dijadwalkan'])
            // ->whereIn('status', ['menunggu', 'diproses', 'dijadwalkan', 'selesai', 'dibatalkan'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($req) {
                return [
                    'id' => $req->id,
                    'title' => $req->title ?? 'Pekerjaan Tanpa Judul',
                    'category' => $req->category ?? '-',
                    'description' => $req->description ?? '',
                    'scheduled_for' => $req->scheduled_for
                        ? \Carbon\Carbon::parse($req->scheduled_for)->toDateTimeString()
                        : null,
                    'status' => $req->status,
                    'price_offer' => Payment::where('service_request_id', $req->id)->value('amount') ?? null,
                ];
            });

        return Inertia::render('user/dashboard', [
            'stats' => $tasks,
            'recent' => $request_items,
            'categories' => $categories,
        ]);
    }

    public function refundIndex(Request $request)
    {
        // --- [MODIFIKASI] --- Query builder untuk filter dinamis
        $query = Refund::whereHas('payment', function ($q) {
            $q->where('user_id', Auth::id());
        })
            ->with([
                'payment.serviceRequest:id,title,category,created_at',
            ])
            ->latest();

        // Terapkan filter 'status' jika ada
        $query->when($request->input('status'), function ($q, $status) {
            $q->where('status', $status);
        });

        // Terapkan filter 'tanggal_mulai' jika ada
        $query->when($request->input('tanggal_mulai'), function ($q, $date) {
            $q->whereDate('created_at', $date);
        });

        // Terapkan filter 'search' jika ada (mencari di judul service request)
        $query->when($request->input('search'), function ($q, $search) {
            $q->whereHas('payment.serviceRequest', function ($subQ) use ($search) {
                $subQ->where('title', 'like', "%{$search}%");
            });
        });

        // Lanjutkan dengan paginasi
        $refunds = $query->paginate()->withQueryString();

        // Transformasi data
        $refunds->through(function ($refund) {
            return [
                'id' => $refund->id,
                'title' => 'Refund: ' . ($refund->payment->serviceRequest->title ?? 'Layanan Dihapus'),
                'category' => $refund->payment->serviceRequest->category ?? '-',
                'status' => $refund->status,
                'accepted_price' => $refund->amount,
                'created_at' => $refund->created_at->toIso8601String(),
            ];
        });

        return Inertia::render('user/refund', [
            'serviceRequests' => $refunds,
            'filters' => $request->only(['search', 'status', 'tanggal_mulai']),
        ]);
    }

    public function refundCreate(Request $request, $service_request_id)
    {
        // 1. Ambil data ServiceRequest secara manual, gunakan findOrFail untuk otomatis 404 jika tidak ada
        $serviceRequest = ServiceRequest::findOrFail($service_request_id);

        // 2. Otorisasi: Pastikan user yang mengakses adalah pemilik permintaan
        if (Auth::id() !== $serviceRequest->user_id) {
            abort(403, 'Akses ditolak.');
        }

        // 3. Ambil data payment yang berelasi
        $payment = Payment::where('service_request_id', $service_request_id)->first();

        // 4. Validasi: Pastikan ada pembayaran dan statusnya sudah lunas (settled)
        if (!$payment || !$payment->isSettled()) {
            return redirect()->back()->withErrors(['payment' => 'Refund hanya bisa diajukan untuk layanan yang sudah lunas.']);
        }

        // 5. Kirim data yang relevan ke frontend
        return Inertia::render('user/refund-form', [
            'serviceRequest' => [
                'id' => $serviceRequest->id,
                'title' => $serviceRequest->title,
                'category' => $serviceRequest->category,
                'scheduled_for' => $serviceRequest->scheduled_for
                    ? \Carbon\Carbon::parse($serviceRequest->scheduled_for)->toDateTimeString()
                    : null,
                'bank_name' => Auth::user()->bank_name,
                'account_name' => Auth::user()->account_name,
                'account_number' => Auth::user()->account_number,
            ],
            'payment' => [
                'id' => $payment->id,
                'amount' => $payment->amount,
                'paid_at' => $payment->paid_at,
                'provider' => $payment->provider,
                'provider_ref' => $payment->provider_ref,
                'payload' => $payment->webhook_payload,
            ]
        ]);
    }

    public function refundStore(Request $request)
    {
        // 1. Validasi semua data yang dikirim dari form, termasuk data "rahasia"
        $validated = $request->validate([
            'reason'         => 'required|string|max:1000',
            'bank_name'      => 'required|string|max:50',
            'account_name'   => 'required|string|max:255',
            'account_number' => 'required|string|max:50',
            'payment_id'     => 'required|integer|exists:payments,id', // Validasi payment_id dari form
        ]);

        // 2. [CROSS-CHECK] Ambil data Payment dari database berdasarkan ID dari form
        $payment = Payment::findOrFail($validated['payment_id']);

        // 3. [OTORISASI] Pastikan user yang login adalah pemilik pembayaran ini
        //    Ini lebih aman daripada mengecek kepemilikan ServiceRequest
        if (Auth::id() !== $payment->user_id) {
            abort(403, 'Akses ditolak.');
        }

        // 4. [VALIDASI KONDISI] Pastikan pembayaran berstatus 'settled'
        if (!$payment->isSettled()) {
            return back()->withErrors(['refund' => 'Refund hanya bisa diajukan untuk layanan yang sudah lunas.']);
        }

        // 5. Buat record baru di tabel 'refunds' sesuai skema Anda
        Refund::create([
            'payment_id'   => $payment->id,
            'amount'       => $payment->amount,         // Diambil dari server, bukan form
            'provider_ref' => $payment->provider_ref,   // Diambil dari server, bukan form
            'reason'       => $validated['reason'],
            'status'       => 'requested',

            // --- [SESUAI PERMINTAAN] --- Menyimpan 2 jenis payload ---
            'payload' => [
                // Payload 1: Data bank dari form refund
                'refund_bank_details' => [
                    'user_bank_name'      => $validated['bank_name'],
                    'user_account_name'   => $validated['account_name'],
                    'user_account_number' => $validated['account_number'],
                ],
                // Payload 2: Data asli dari webhook Midtrans (diambil dari payment)
                'original_midtrans_payment_payload' => $payment->webhook_payload,
            ],
        ]);

        // 6. Update status relasi
        $payment->update(['status' => 'refunded']);
        $payment->serviceRequest->update(['status' => 'dibatalkan']);

        // 7. Redirect ke halaman detail dengan pesan sukses
        return redirect()->route('user.refund.index', $payment->service_request_id)
            ->with('status', 'refund_request_submitted');
    }
}
