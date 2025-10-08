<?php

namespace App\Http\Controllers\Teknisi;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\ServiceRequest;
use App\Models\TechnicianService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Balance;

class TechnicianController extends Controller
{
    public function index()
    {
        $technician = Auth::user();
        if (!$technician || $technician->role !== 'teknisi') abort(403);

        $technician_id = $technician->id;

        $available = TechnicianService::where('technician_id', $technician_id)
            ->where('active', true)
            ->exists();

        // 1. Ambil SEMUA kategori yang tersedia di sistem.
        $allCategories = Category::all();

        // 2. Ambil slug dari kolom 'category', bukan 'category_id'.
        $activeCategorySlugs = TechnicianService::where('technician_id', $technician->id)
            ->where('active', true)
            ->pluck('category');

        // 3. Gabungkan data:
        $categories = $allCategories->map(function ($category) use ($activeCategorySlugs) {
            $category->is_active = $activeCategorySlugs->contains($category->slug);
            return $category;
        });
        // dd($categories);

        $tasks = [
            'today' => ServiceRequest::where('technician_id', $technician_id)
                ->where('status', 'menunggu')
                ->count(),
            'in_progress' => ServiceRequest::where('technician_id', $technician_id)
                ->where('status', 'diproses')
                ->count(),
            'revenue_today' => Balance::where('owner_id', $technician_id)
            ->whereIn('type', ['escrow_release', 'paid', 'payout_request'])
            ->sum('amount')
        ];
        // dd($tasks);

        $job_items = ServiceRequest::where('technician_id', $technician_id)
            ->whereIn('status', ['menunggu', 'diproses', 'dijadwalkan']) // filter sesuai kebutuhan
            // ->whereIn('status', ['menunggu', 'diproses', 'dijadwalkan', 'selesai', 'dibatalkan']) // filter sesuai kebutuhan
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($req) {
                return [
                    'id' => $req->id,
                    'title' => $req->title ?? 'Pekerjaan Tanpa Judul', // fallback kalau tidak ada
                    'category' => $req->category ?? '-',
                    'description' => $req->description ?? '',
                    // 'scheduled_for' => $req->scheduled_for ? $req->scheduled_for->toDateTimeString() : null,
                    'scheduled_for' => $req->scheduled_for
                        ? \Carbon\Carbon::parse($req->scheduled_for)->toDateTimeString()
                        : null,
                    'status' => $req->status, // pastikan value sesuai union type di TS
                    'price_offer' => $req->price_offer ?? null,
                ];
            });


        return Inertia::render('teknisi/dashboard', [
            'available' => $available,
            'stats' => $tasks, // React kamu expect `stats`, bukan `tasks`
            'incoming' => $job_items,
            'categories' => $categories,

        ]);
    }

    public function toggleAvailability(Request $request)
    {
        $user = Auth::user();

        if (!$user || !$user->isTeknisi()) {
            // Gunakan abort untuk konsistensi
            abort(403, 'Akses ditolak.');
        }

        $validated = $request->validate([
            'available' => 'required|boolean',
        ]);

        // Logika ini sudah benar: update semua service milik teknisi
        TechnicianService::where('technician_id', $user->id)
            ->update(['active' => $validated['available']]);

        return redirect()->back()->with('status', 'availability_updated');
    }

    public function toggleCategoryStatus(Request $request)
    {
        $request->validate([
            'category_id' => 'required|exists:categories,id',
            'active' => 'required|boolean',
        ]);

        $technician = Auth::user();

        // --- [PERBAIKAN] ---
        // 1. Ambil ID kategori dari request.
        $categoryId = $request->category_id;

        // 2. Cari kategori berdasarkan ID tersebut untuk mendapatkan slug-nya.
        $category = Category::find($categoryId);

        // Jika kategori tidak ditemukan (meskipun seharusnya tidak terjadi karena validasi), hentikan.
        if (!$category) {
            return redirect()->back()->withErrors(['message' => 'Kategori tidak ditemukan.']);
        }

        // 3. Gunakan 'slug' dari kategori untuk mencari atau membuat record di technician_services
        //    sesuai dengan struktur tabel Anda yang unik.
        TechnicianService::updateOrCreate(
            [
                'technician_id' => $technician->id,
                'category'      => $category->slug, // <-- Menggunakan kolom 'category' dengan nilai slug
            ],
            [
                'active' => $request->active,
            ]
        );

        return redirect()->back()->with('status', 'category_status_updated');
    }
}
