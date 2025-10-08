<?php

namespace App\Http\Controllers\Teknisi;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Payout; // Import model Payout
use Illuminate\Support\Facades\Auth;

class PayoutController extends Controller
{

    public function index(Request $request)
    {
        $technician = Auth::user();

        // Query builder untuk filter dinamis
        $query = Payout::where('technician_id', $technician->id)->latest();

        // Terapkan filter 'status'
        $query->when($request->input('status'), function ($q, $status) {
            $q->where('status', $status);
        });

        // Terapkan filter 'tanggal_mulai' (berdasarkan created_at)
        $query->when($request->input('tanggal_mulai'), function ($q, $date) {
            $q->whereDate('created_at', $date);
        });

        // Terapkan filter 'search' (berdasarkan jumlah/amount)
        $query->when($request->input('search'), function ($q, $search) {
            // Hanya cari jika input adalah angka
            if (is_numeric($search)) {
                $q->where('amount', 'like', "%{$search}%");
            }
        });

        // Lanjutkan dengan paginasi
        $payouts = $query->paginate()->withQueryString();

        // Transformasi data agar strukturnya SAMA PERSIS dengan halaman Pekerjaan
        $payouts->through(function ($payout) {
            return [
                'id' => $payout->id,
                'title' => 'Pencairan Dana', // Judul statis
                'category' => "{$payout->bank_name} - {$payout->account_number}", // Kategori kita ganti dengan info bank
                'status' => $payout->status, // Status dari payout ('pending', 'paid', 'rejected')
                'price_offer' => $payout->amount, // Gunakan amount dari payout
                'scheduled_for' => $payout->paid_at ? $payout->paid_at->toIso8601String() : null, // Jika sudah dibayar
                'created_at' => $payout->created_at->toIso8601String(),
            ];
        });

        return Inertia::render('teknisi/payout-index', [
            'incoming' => $payouts, // Kita tetap gunakan nama prop 'incoming' agar konsisten
            'filters' => $request->only(['search', 'status', 'tanggal_mulai']),
        ]);
    }
}
