<?php

namespace App\Http\Controllers;

use App\Models\Balance;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class WalletController extends Controller
{
    public function indexUser()
    {
        $user = Auth::user();

        // Ambil semua transaksi user
        $balances = Balance::where('owner_id', $user->id)
            ->where('owner_role', 'user')
            ->orderBy('created_at', 'desc')
            ->get();

        // Jika belum ada transaksi, buat entri nol (optional)
        if ($balances->isEmpty()) {
            Balance::create([
                'owner_role' => 'user',
                'owner_id'   => $user->id,
                'amount'     => 0,
                'type'       => 'initial_balance',
                'note'       => 'Saldo awal dibuat otomatis',
                'currency'   => 'IDR',
            ]);

            $balances = Balance::where('owner_id', $user->id)
                ->where('owner_role', 'user')
                ->orderBy('created_at', 'desc')
                ->get();
        }

        // --- Rumus ledger ---
        $saldoSaatIni = $balances->sum('amount');
        $dalamPenahanan = $balances->where('type', 'escrow_release')->sum('amount');
        $siapDitarik = $saldoSaatIni - $dalamPenahanan;

        return Inertia::render('user/wallet/index', [
            'balances'        => $balances,
            'saldoSaatIni'    => $saldoSaatIni,
            'dalamPenahanan'  => $dalamPenahanan,
            'siapDitarik'     => $siapDitarik,
            'currency'        => 'IDR',
        ]);
    }
}
