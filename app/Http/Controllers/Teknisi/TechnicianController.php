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
                ->whereDate('created_at', today())
                ->count(),
            'in_progress' => ServiceRequest::where('technician_id', $technician_id)
                ->where('status', 'dalam proses')
                ->count(),
            'revenue_today' => 0, // Placeholder before implementation
        ];

        return Inertia::render('teknisi/dashboard', [
            'available' => $available,
            'stats' => $tasks, // React kamu expect `stats`, bukan `tasks`
        ]);
    }
}
