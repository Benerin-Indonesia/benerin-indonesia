<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ServiceRequest;
use App\Models\Payment;
use App\Models\Payout;
use App\Models\User;
use App\Models\Balance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // ===== Guard tanpa Kernel middleware =====
        $user = $request->user();
        if (!$user) {
            // belum login → ke form login admin
            return redirect()->route('admin.login.show');
        }
        if (!in_array($user->role, ['admin'])) {
            abort(403, 'Hanya admin yang boleh mengakses.');
        }

        // ===== Query DB untuk KPI =====
        $requestsTotal    = ServiceRequest::count();
        $requestsOpen     = ServiceRequest::whereIn('status', ['menunggu','diproses'])->count();
        $paymentsPending  = Payment::where('status', 'pending')->count();
        $payoutsPending   = Payout::where('status', 'pending')->count();

        $usersTotal       = User::where('role', 'user')->count();
        // Antisipasi enum lama 'teknisi' maupun 'technician' bila ada
        $techniciansTotal = User::whereIn('role', ['technician','teknisi'])->count();

        // Ledger saldo tertahan teknisi (total amount)
        $balanceHold      = (float) Balance::where('owner_role', 'technician')
                                ->sum(DB::raw('amount'));

        // ===== Tabel ringkas: permintaan & pembayaran terbaru =====
        $recentRequests = ServiceRequest::with('user:id,name')
            ->latest()
            ->take(4)
            ->get()
            ->map(fn($r) => [
                'id'         => $r->id,
                'user_name'  => $r->user?->name ?? '-',
                'category'   => $r->category,
                'status'     => $r->status,
                'created_at' => optional($r->created_at)->format('Y-m-d H:i'),
            ]);

        $recentPayments = Payment::with('user:id,name')
            ->latest()
            ->take(4)
            ->get()
            ->map(fn($p) => [
                'id'          => $p->id,
                'request_id'  => $p->service_request_id,
                'user_name'   => $p->user?->name ?? '-',
                'amount'      => (float) $p->amount,
                'status'      => $p->status,
                'updated_at'  => optional($p->updated_at)->format('Y-m-d H:i'),
            ]);

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'requests_total'    => $requestsTotal,
                'requests_open'     => $requestsOpen,
                'payments_pending'  => $paymentsPending,
                'payouts_pending'   => $payoutsPending,
                'users_total'       => $usersTotal,
                'technicians_total' => $techniciansTotal,
                'balance_hold'      => $balanceHold,
            ],
            'recentRequests' => $recentRequests,
            'recentPayments' => $recentPayments,
        ]);
    }
}
