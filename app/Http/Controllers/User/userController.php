<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\ServiceRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class userController extends Controller
{
    function index()
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'user') abort(403);

        $user_id = $user->id;

        $tasks = [
            'active' => ServiceRequest::where('user_id', $user_id)
                ->whereDate('created_at', today())
                ->count(),
            'scheduled' => ServiceRequest::where('user_id', $user_id)
                ->where('status', 'dalam proses')
                ->count(),
            'completed' => ServiceRequest::where('user_id', $user_id)
                ->where('status', 'selesai')
                ->count(),
        ];

        $request_items = ServiceRequest::where('user_id', $user_id)
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

        return Inertia::render('user/dashboard', [
            'stats' => $tasks,
            'recent' => $request_items,
        ]);
    }
}
