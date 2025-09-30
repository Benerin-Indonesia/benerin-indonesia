<?php

namespace App\Http\Controllers\ServiceRequest\User;

use App\Http\Controllers\Controller;
use App\Models\Category;
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
        $categories = Category::select('id', 'name', 'slug')->get(); // NO LIMIT
        // dd($categories);

        return Inertia::render('user/form/create', [
            'initialCategory' => $request->query('category', ''),
            'categories' => $categories,
        ]);
    }

    // public function createPrice(Request $request)
    // {
    //     $request->validate([
    //         'request_id' => 'required|exists:service_requests,id',
    //         'offer_price' => 'required|numeric|min:0',
    //     ]);

    //     $serviceRequest = ServiceRequest::find($request->request_id);
    //     if (!$serviceRequest) {
    //         return redirect()->back()->withErrors(['error' => 'Service request not found.']);
    //     }

    //     if ($serviceRequest->status == "menunggu") {
    //         $serviceRequest->accepted_price = $request->offer_price;
    //         $serviceRequest->status = 'menunggu'; // Update status to 'diproses'
    //         $serviceRequest->save();

    //         return redirect()->back()->with('success', 'Price offer submitted successfully.');
    //     } else {
    //         return redirect()->back()->with('gagal', 'sesi penawaran telah berakir');
    //     }
    // }

    /**
     * Form buat menerima tawaran harga dari teknisi
     */
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

    /**
     * Form buat menolak tawaran harga dari teknisi
     */
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
     * Menampilkan service secara detail
     */
    public function show(Request $request)
    {
        $request = ServiceRequest::findorFail($request->id);
        // dd($request);

        return Inertia::render('user/request-service/show', [
            'request' => $request,
        ]);
    }

    /**
     * Simpan permintaan servis baru
     */
    public function store(Request $request)
    {
        // dd($request->all());
        $validated = $request->validate([
            'category'      => 'required|string|max:255',
            'title'         => 'required|string|max:255',
            'description'   => 'required|string',
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

        // Simpan request
        ServiceRequest::create([
            'user_id'       => $request->user()->id,
            'technician_id' => 1,
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
