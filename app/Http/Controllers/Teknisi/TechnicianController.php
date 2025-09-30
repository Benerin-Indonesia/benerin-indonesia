<?php

namespace App\Http\Controllers\Teknisi;

use App\Http\Controllers\Controller;
use App\Models\ServiceRequest;
use App\Models\TechnicianService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

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

        $tasks = [
            'today' => ServiceRequest::where('technician_id', $technician_id)
                ->where('status', 'menunggu')
                ->count(),
            'in_progress' => ServiceRequest::where('technician_id', $technician_id)
                ->where('status', 'diproses')
                ->count(),
            'revenue_today' => 0, // Placeholder before implementation
        ];

        $job_items = ServiceRequest::where('technician_id', $technician_id)
            ->whereIn('status', ['menunggu', 'diproses', 'dijadwalkan', 'selesai', 'dibatalkan']) // filter sesuai kebutuhan
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
        ]);
    }
}
