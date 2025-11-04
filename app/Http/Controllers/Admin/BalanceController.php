<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Balance;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BalanceController extends Controller
{
    public function index(Request $request)
    {
        $filters = [
            'q'          => $request->string('q')->toString(),
            'owner_role' => $request->string('owner_role')->toString(),
            'type'       => $request->string('type')->toString(),
            'date_from'  => $request->string('date_from')->toString(),
            'date_to'    => $request->string('date_to')->toString(),
            'amount_min' => $request->string('amount_min')->toString(),
            'amount_max' => $request->string('amount_max')->toString(),
            'owner_id'   => $request->string('owner_id')->toString(),
            'ref_table'  => $request->string('ref_table')->toString(),
            'ref_id'     => $request->string('ref_id')->toString(),
        ];

        // Daftar semua akun non-admin (user & teknisi) — SELALU tampil
        $ownersBase = User::query()
            ->whereIn('role', ['user', 'teknisi'])
            ->when($filters['owner_role'] !== '', fn($q) => $q->where('role', $filters['owner_role']))
            ->when($filters['q'] !== '', function ($q) use ($filters) {
                $term  = '%' . str_replace(' ', '%', $filters['q']) . '%';
                $idNum = ctype_digit($filters['q']) ? (int) $filters['q'] : null;
                $q->where(function ($w) use ($term, $idNum) {
                    if ($idNum !== null) {
                        $w->orWhere('id', $idNum);
                    }
                    $w->orWhere('name', 'like', $term)
                      ->orWhere('email', 'like', $term)
                      ->orWhere('phone', 'like', $term);
                });
            });

        // LEFT JOIN ke balances dengan kondisi yang menyesuaikan role
        // NOTE: filter type/date/owner_id/ref_table/ref_id ditempatkan di ON agar akun tanpa transaksi tetap ikut.
        $ownersAgg = $ownersBase
            ->leftJoin('balances as b', function ($join) use ($filters) {
                $join->on('b.owner_id', '=', 'users.id')
                     ->where(function ($j) {
                         $j->where(function ($w) {
                             $w->where('users.role', 'user')
                               ->where('b.owner_role', 'user');
                         })->orWhere(function ($w) {
                             $w->where('users.role', 'teknisi')
                               ->whereIn('b.owner_role', ['teknisi', 'technician']);
                         });
                     });

                // Filter yang berkaitan dengan transaksi—di ON supaya null tetap bisa join
                if ($filters['type'] !== '')       $join->where('b.type', $filters['type']);
                if ($filters['date_from'] !== '')  $join->whereDate('b.created_at', '>=', $filters['date_from']);
                if ($filters['date_to']   !== '')  $join->whereDate('b.created_at', '<=', $filters['date_to']);
                if ($filters['owner_id']  !== '')  $join->where('b.owner_id', $filters['owner_id']);
                if ($filters['ref_table'] !== '')  $join->where('b.ref_table', 'like', $filters['ref_table']);
                if ($filters['ref_id']    !== '')  $join->where('b.ref_id', $filters['ref_id']);
            })
            ->groupBy('users.id', 'users.name', 'users.email', 'users.phone', 'users.role')
            ->select([
                'users.id',
                'users.name',
                'users.email',
                'users.phone',
                'users.role',
                // Agregasi aman null
                DB::raw('COALESCE(SUM(b.amount), 0)                                       as balance'),
                DB::raw('COALESCE(SUM(CASE WHEN b.amount >= 0 THEN b.amount ELSE 0 END), 0) as total_credit'),
                DB::raw('COALESCE(SUM(CASE WHEN b.amount <  0 THEN b.amount ELSE 0 END), 0) as total_debit'),
                DB::raw('COUNT(b.id) as entries_count'),
            ])
            // Filter nominal jika diisi — pakai HAVING agar pakai alias agregat
            ->when($filters['amount_min'] !== '', fn($q) => $q->having('balance', '>=', $filters['amount_min']))
            ->when($filters['amount_max'] !== '', fn($q) => $q->having('balance', '<=', $filters['amount_max']))
            // Urut default saldo terbesar
            ->orderByDesc('balance')
            ->paginate(20)
            ->withQueryString();

        // (Opsional) total seluruh saldo untuk kartu ringkasan
        $totals = [
            'total_users'       => $ownersAgg->total(),
            'total_all_balance' => (float) collect($ownersAgg->items())->sum(fn($it) => (float) $it->balance),
            'total_credit'      => (float) collect($ownersAgg->items())->sum(fn($it) => (float) $it->total_credit),
            'total_debit'       => (float) collect($ownersAgg->items())->sum(fn($it) => (float) $it->total_debit),
        ];

        return Inertia::render('admin/balances/index', [
            // Kirim daftar “owners” teragregasi (user & teknisi), termasuk yang tak punya transaksi (=0)
            'owners'  => $ownersAgg->through(function ($row) {
                return [
                    'id'           => (int) $row->id,
                    'role'         => $row->role === 'teknisi' ? 'teknisi' : 'user',
                    'name'         => $row->name,
                    'email'        => $row->email,
                    'phone'        => $row->phone,
                    'totalCredit'  => (float) $row->total_credit,
                    'totalDebit'   => (float) $row->total_debit,
                    'balance'      => (float) $row->balance,
                    'entriesCount' => (int) $row->entries_count,
                ];
            }),
            'filters' => $filters,
            'totals'  => $totals,
        ]);
    }

    public function show(Request $request, string $role, int $id)
    {
        abort_unless(in_array($role, ['user','teknisi'], true), 404);

        // ambil juga field rekening bank
        $ownerModel = User::query()
            ->select('id','name','email','phone','role','bank_name','account_name','account_number')
            ->where('id', $id)
            ->when($role === 'teknisi',
                fn($q) => $q->whereIn('role', ['teknisi','technician']),
                fn($q) => $q->where('role', $role)
            )
            ->firstOrFail();

        $owner = [
            'id'             => $ownerModel->id,
            'role'           => $role,
            'name'           => $ownerModel->name,
            'email'          => $ownerModel->email,
            'phone'          => $ownerModel->phone,
            'bank_name'      => $ownerModel->bank_name,
            'account_name'   => $ownerModel->account_name,
            'account_number' => $ownerModel->account_number,
        ];

        $filters = [
            'q'          => $request->string('q')->toString(),
            'type'       => $request->string('type')->toString(),
            'date_from'  => $request->string('date_from')->toString(),
            'date_to'    => $request->string('date_to')->toString(),
            'amount_min' => $request->string('amount_min')->toString(),
            'amount_max' => $request->string('amount_max')->toString(),
            'ref_table'  => $request->string('ref_table')->toString(),
            'ref_id'     => $request->string('ref_id')->toString(),
        ];

        $query = Balance::query()
            ->when($role === 'teknisi',
                fn($q) => $q->whereIn('owner_role', ['teknisi','technician']),
                fn($q) => $q->where('owner_role', $role)
            )
            ->where('owner_id', $id)
            ->when($filters['q'] !== '', function ($q) use ($filters, $id) {
                $term  = '%' . str_replace(' ', '%', $filters['q']) . '%';
                $idNum = ctype_digit($filters['q']) ? (int) $filters['q'] : null;

                $q->where(function ($w) use ($term, $idNum, $id) {
                    if ($idNum !== null) {
                        $w->orWhere('id', $idNum)
                          ->orWhere('ref_id', $idNum);
                    }

                    $w->orWhere('ref_table', 'like', $term)
                      ->orWhere('note', 'like', $term);

                    $w->orWhereExists(function ($sq) use ($term, $id) {
                        $sq->select(DB::raw(1))
                           ->from('users')
                           ->where('users.id', $id)
                           ->where(function ($s) use ($term) {
                               $s->where('users.name', 'like', $term)
                                 ->orWhere('users.email', 'like', $term);
                           });
                    });
                });
            })
            ->when($filters['type'] !== '',       fn($q) => $q->where('type', $filters['type']))
            ->when($filters['date_from'] !== '',  fn($q) => $q->whereDate('created_at', '>=', $filters['date_from']))
            ->when($filters['date_to'] !== '',    fn($q) => $q->whereDate('created_at', '<=', $filters['date_to']))
            ->when($filters['amount_min'] !== '', fn($q) => $q->where('amount', '>=', $filters['amount_min']))
            ->when($filters['amount_max'] !== '', fn($q) => $q->where('amount', '<=', $filters['amount_max']))
            ->when($filters['ref_table'] !== '',  fn($q) => $q->where('ref_table', 'like', $filters['ref_table']))
            ->when($filters['ref_id'] !== '',     fn($q) => $q->where('ref_id', $filters['ref_id']))
            ->orderBy('created_at');

        $entries = $query->paginate(50)->withQueryString();

        return Inertia::render('admin/balances/show', [
            'owner'   => $owner,
            'entries' => $entries,
            'filters' => $filters,
        ]);
    }
}
