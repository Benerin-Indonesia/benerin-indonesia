<?php

namespace App\Http\Controllers\ServiceRequest;

use App\Http\Controllers\Controller;
use App\Models\ServiceRequest;
use App\Models\TechnicianService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ServiceRequestController extends Controller
{
    /**
     * Form buat permintaan baru
     */
    public function buatPermintaan(Request $request)
    {
        return Inertia::render('user/form/create', [
            'initialCategory' => $request->query('category', ''),
        ]);
    }

    /**
     * Simpan permintaan servis baru
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category'      => 'required|string|max:255',
            'title'         => 'required|string|max:255',
            'description'   => 'required|string',
            'scheduled_for' => 'required|date|after_or_equal:now',
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

        // Simpan request
        ServiceRequest::create([
            'user_id'       => $request->user()->id,
            'technician_id' => 37,
            // 'technician_id' => $technician->technician_id, // FK ke users
            'title'         => $validated['title'],
            'category'      => $slugCategory,
            'description'   => $validated['description'],
            'scheduled_for' => $validated['scheduled_for'],
            'status'        => 'menunggu',
        ]);

        return redirect()
            ->route('user.dashboard')
            ->with('success', 'Permintaan servis berhasil dibuat.');
    }
}
