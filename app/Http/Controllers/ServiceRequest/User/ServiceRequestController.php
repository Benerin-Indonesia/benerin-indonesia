<?php

namespace App\Http\Controllers\ServiceRequest\User;

use App\Http\Controllers\Controller;
use App\Models\Balance;
use App\Models\Category;
use App\Models\Payment;
use App\Models\RequestPhoto;
use App\Models\ServiceRequest;
use App\Models\TechnicianService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ServiceRequestController extends Controller
{
    // public function index()
    // {
    //     $serviceRequest = ServiceRequest::all();

    //     return Inertia::render('user/request-service/index', [
    //         "serviceRequests" => $serviceRequest
    //     ]);
    // }
    public function index(Request $request)
    {
        // Validasi input filter untuk keamanan
        $request->validate([
            'status'        => 'nullable|string|in:menunggu,diproses,dijadwalkan,selesai,dibatalkan',
            'search'        => 'nullable|string|max:100',
            'tanggal_mulai' => 'nullable|date',
            'tanggal_akhir' => 'nullable|date|after_or_equal:tanggal_mulai',
        ]);

        $query = ServiceRequest::query()
            ->with('user:id,name')
            ->where('user_id', auth()->id())
            ->latest('id');

        // Terapkan filter pencarian
        $query->when($request->input('search'), function ($q, $search) {
            $q->where('title', 'like', '%' . $search . '%');
        });

        // Terapkan filter status
        $query->when($request->input('status'), function ($q, $status) {
            $q->where('status', $status);
        });

        // Terapkan filter tanggal_mulai
        $query->when($request->input('tanggal_mulai'), function ($q, $tanggalMulai) {
            $q->whereDate('created_at', '>=', $tanggalMulai);
        });

        // Terapkan filter tanggal_akhir
        $query->when($request->input('tanggal_akhir'), function ($q, $tanggalAkhir) {
            $q->whereDate('created_at', '<=', $tanggalAkhir);
        });

        $serviceRequests = $query->paginate()->withQueryString();

        return Inertia::render('user/request-service/index', [
            'serviceRequests' => $serviceRequests,
            'filters' => $request->only(['search', 'status', 'tanggal_mulai', 'tanggal_akhir']),
        ]);
    }

    public function categoriesIndex()
    {
        // Ambil semua kategori dari database
        $categories = Category::all()->map(function ($category) {
            return [
                'slug' => $category->slug,
                'name' => $category->name,
                // Pastikan path ikon di-resolve dengan benar menggunakan asset()
                'icon' => asset($category->icon),
                'description' => $category->description, // Tambahkan deskripsi
            ];
        });

        return Inertia::render('user/request-service/categories-index', [
            'categories' => $categories,
        ]);
    }

    /**
     * Form buat permintaan baru
     */
    public function buatPermintaan(Request $request)
    {
        // $categories = Category::select('id', 'slug', 'name', 'icon', 'hint')->limit(4)->get();
        $categories = Category::select('id', 'name', 'slug', 'icon')->get(); // NO LIMIT

        return Inertia::render('user/form/create', [
            'initialCategory' => $request->query('category', ''),
            'categories' => $categories,
        ]);
    }

    public function acceptPrice(Request $request, $id)
    {
        // Cari service request berdasarkan ID dan user yang sedang login
        $serviceRequest = ServiceRequest::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        // Update status
        $serviceRequest->update([
            'status' => 'dijadwalkan',
        ]);

        return redirect()
            ->back()
            ->with('success', 'Penawaran berhasil diterima dan dijadwalkan.');
    }


    public function show(Request $request)
    {
        // --- PEMBENAHAN 1: KEAMANAN (OTORISASI) & EFISIENSI (EAGER LOADING) ---
        // mencegah N+1 query problem.
        $serviceRequest = ServiceRequest::with(['messages.sender'])
            // Pastikan user yang login hanya bisa melihat permintaannya sendiri.
            ->where('user_id', Auth::id())
            ->findOrFail($request->id);

        // --- PEMBENAHAN 2: MENGAMBIL DATA PAYMENT DENGAN CARA YANG LEBIH ANDAL ---
        $payment = Payment::where('service_request_id', $serviceRequest->id)
            ->latest()
            ->first();

        $requestPhotoPath = RequestPhoto::where('service_request_id', $serviceRequest->id)->first();
        // dd($requestPhotoPath->path);

        $paymentStatus = $payment ? $payment->status : false;

        $needsPaymentAction = !($payment && $payment->status === 'settled');

        // --- PEMBENAHAN 3: MENGAKSES DATA PESAN YANG SUDAH DI-LOAD ---
        // tidak perlu query lagi, karena datanya sudah dimuat oleh `with()`.
        $messages = $serviceRequest->messages;

        return Inertia::render('user/request-service/show', [
            'request' => $serviceRequest,
            'paymentStatus' => $paymentStatus,
            'requestPhotoPath' => $requestPhotoPath->path ?? null,
            'initialMessages' => $messages,
            'needsPaymentAction' => $needsPaymentAction,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category'      => 'required|string|max:255',
            'title'         => 'required|string|max:255',
            'description'   => 'required|string',
            'scheduled_for' => 'required|date|after_or_equal:today',
            'image'         => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        // slug kategori
        $slugCategory = Str::slug($validated['category']);

        // Cari teknisi aktif random sesuai kategori
        $technician = TechnicianService::where('category', $slugCategory)
            ->where('active', true)
            ->inRandomOrder()
            ->first();

        if (! $technician) {
            return back()->withErrors([
                'error_notif' => 'Maaf, tidak ada teknisi tersedia untuk kategori ini. Silakan coba lagi nanti.',
            ]);
        }

        // --- Simpan Service Request ---
        $serviceRequest = ServiceRequest::create([
            'user_id'       => $request->user()->id,
            'technician_id' => $technician->technician_id, // FK ke users
            'title'         => $validated['title'],
            'category'      => $slugCategory,
            'description'   => $validated['description'],
            'scheduled_for' => $validated['scheduled_for'],
            'status'        => 'menunggu',
        ]);

        // --- Simpan foto request (jika ada gambar) ---
        if ($request->hasFile('image')) {
            // Simpan file ke storage/app/public/request-photo-service/
            $path = $request->file('image')->store('request_photos', 'public');

            // Simpan record ke tabel request_photos
            RequestPhoto::create([
                'service_request_id' => $serviceRequest->id,
                'path' => $path,
            ]);
        }

        return redirect()
            ->route('user.permintaan.show', $serviceRequest->id)
            ->with('success', 'Permintaan servis berhasil dibuat.');
    }

    public function rejectPrice(Request $request, $id)
    {
        // Cari service request berdasarkan ID dan user yang sedang login
        $serviceRequest = ServiceRequest::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        // Update status
        $serviceRequest->update([
            'status' => 'menunggu',
            'accepted_price' => null
        ]);

        return redirect()
            ->back()
            ->with('fail', 'Penawaran harga berhasil ditolak');
    }

    /**
     * Method untuk menyelesaikan layanan oleh user.
     */
    public function endService(Request $request)
    {
        // 1. VALIDASI INPUT
        // Pastikan frontend mengirim 'id' dari service request
        $validated = $request->validate([
            'id' => 'required|exists:service_requests,id',
        ]);

        // 2. PENGAMBILAN DATA BERDASARKAN REQUEST
        // Ambil ServiceRequest dari database berdasarkan ID yang dikirim dari form
        $serviceRequest = ServiceRequest::find($validated['id']);
        
        // 3. OTORISASI & VALIDASI KONDISI
        // Pastikan user yang login adalah pemilik Service Request
        if (Auth::id() !== $serviceRequest->user_id) {
            abort(403, 'Akses ditolak.');
        }
        
        // Pastikan layanan berada di status yang benar ('dijadwalkan')
        if ($serviceRequest->status !== 'dijadwalkan') {
            return redirect()->back()->withErrors(['status' => 'Layanan ini tidak dapat diselesaikan.']);
        }
        
        // Ambil data pembayaran yang sudah lunas (settled)
        $payment = Payment::where('service_request_id', $serviceRequest->id)->where('status', 'settled')->first();
        if (!$payment) {
            return redirect()->back()->withErrors(['payment' => 'Penyelesaian gagal karena data pembayaran tidak ditemukan atau belum lunas.']);
        }
        
        // 4. KALKULASI KEUANGAN
        $fullAmount = $payment->amount;
        $feePercentage = 0.10; // Fee 10%
        $feeAmount = $fullAmount * $feePercentage;
        $technicianAmount = $fullAmount - $feeAmount;

        // 6. PROSES TRANSAKSI DATABASE (Logika ini tetap sama karena sudah aman)
        DB::transaction(function () use ($serviceRequest, $payment, $fullAmount, $feeAmount, $technicianAmount) {

            // Entri 1: Potong Saldo Pengguna
            Balance::create([
                'owner_role' => 'user',
                'owner_id'   => $serviceRequest->user_id,
                'amount'     => -$fullAmount,
                'type'       => 'escrow_hold',
                'ref_table'  => 'payments',
                'ref_id'     => $payment->id,
                'note'       => "Pembayaran layanan #{$serviceRequest->id}: {$serviceRequest->title}",
                // ... kolom lain ...
            ]);

            // Entri 2: Tambah Saldo Teknisi
            Balance::create([
                'owner_role' => 'technician',
                'owner_id'   => $serviceRequest->technician_id,
                'amount'     => $technicianAmount,
                'type'       => 'escrow_release',
                'ref_table'  => 'payments',
                'ref_id'     => $payment->id,
                'note'       => "Pendapatan bersih 90% dari layanan #{$serviceRequest->id}",
                // ... kolom lain ...
            ]);

            // Entri 3: Data Saldo Fee
            Balance::create([
                'owner_role' => 'technician',
                'owner_id'   => $serviceRequest->technician_id,
                'amount'     => -$feeAmount,
                'type'       => 'service_fee',
                'ref_table'  => 'payments',
                'ref_id'     => $payment->id,
                'note'       => "Biaya platform 10% dari layanan #{$serviceRequest->id}",
                // ... kolom lain ...
            ]);

            // 7. UPDATE STATUS
            $serviceRequest->update(['status' => 'selesai']);
        });

        // 8. KEMBALIKAN RESPONS
        return redirect()->back()->with('status', 'layanan_selesai');
    }
}
