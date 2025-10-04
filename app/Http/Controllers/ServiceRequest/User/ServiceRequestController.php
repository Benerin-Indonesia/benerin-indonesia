<?php

namespace App\Http\Controllers\ServiceRequest\User;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Payment;
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
        // Baris ini tidak diubah.
        $serviceRequest = ServiceRequest::findOrFail($request->id);

        // Ambil record payment.
        $payment = Payment::where('service_request_id', $serviceRequest->id)
            ->latest()
            ->first();

        $paymentStatus = $payment ? $payment->status : false;

        $needsPaymentAction = !($payment && $payment->status === 'settled');

        return Inertia::render('user/request-service/show', [
            'request' => $serviceRequest,
            'paymentStatus' => $paymentStatus,
            'needsPaymentAction' => $needsPaymentAction,
        ]);
    }

    public function store(Request $request)
    {
        // dd($request->all());
        $validated = $request->validate([
            'category'      => 'required|string|max:255',
            'title'         => 'required|string|max:255',
            'description'   => 'required|string',
            // 'scheduled_for' => 'required|date|after_or_equal:today',
            'scheduled_for' => 'required|date',
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
        // dd($technician->technician->phone);

        // Simpan request
        $serviceRequest = ServiceRequest::create([
            'user_id'       => $request->user()->id,
            // 'technician_id' => 8,
            'technician_id' => $technician->technician_id, // FK ke users
            'title'         => $validated['title'],
            'category'      => $slugCategory,
            'description'   => $validated['description'],
            'scheduled_for' => $validated['scheduled_for'],
            'status'        => 'menunggu',
        ]);

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
