<?php

namespace App\Http\Controllers\ServiceRequest\User;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Payment;
use App\Models\RequestPhoto;
use App\Models\ServiceRequest;
use App\Models\TechnicianService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ServiceRequestController extends Controller
{
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

    public function endService(Request $request)
    {
        $serviceRequest = ServiceRequest::where('id', $request->id)->first();
        $serviceRequest->status = "selesai";
        $serviceRequest->save();

        return redirect()
            ->back()
            ->with('selesai', 'layanan servis benerin telah selesai');
    }
}
