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
    /**
     * GET /admin/balances
     * Filters:
     *  - q: cari di id, owner_id, ref_table, ref_id, note, serta nama/email owner
     *  - owner_role: user|technician
     *  - type: hold|payout|adjustment|refund_credit|refund_reversal|payment_debit
     *  - date_from/date_to: filter created_at (YYYY-MM-DD)
     *  - amount_min/amount_max
     *  - owner_id
     *  - ref_table, ref_id
     */
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

        $query = Balance::query()
            // Cari cepat
            ->when($filters['q'] !== '', function ($q) use ($filters) {
                $term  = '%' . str_replace(' ', '%', $filters['q']) . '%';
                $idNum = ctype_digit($filters['q']) ? (int) $filters['q'] : null;

                $q->where(function ($w) use ($term, $idNum) {
                    if ($idNum !== null) {
                        $w->orWhere('id', $idNum)
                          ->orWhere('owner_id', $idNum)
                          ->orWhere('ref_id', $idNum);
                    }

                    $w->orWhere('ref_table', 'like', $term)
                      ->orWhere('note', 'like', $term);

                    // cari owner by name/email tanpa perlu relasi di model
                    $w->orWhereExists(function ($sq) use ($term) {
                        $sq->select(DB::raw(1))
                           ->from('users')
                           ->whereColumn('users.id', 'balances.owner_id')
                           ->where(function ($s) use ($term) {
                               $s->where('users.name', 'like', $term)
                                 ->orWhere('users.email', 'like', $term);
                           });
                    });
                });
            })
            // Filter lainnya
            ->when($filters['owner_role'] !== '', fn ($q) => $q->where('owner_role', $filters['owner_role']))
            ->when($filters['type'] !== '',       fn ($q) => $q->where('type', $filters['type']))
            ->when($filters['date_from'] !== '',  fn ($q) => $q->whereDate('created_at', '>=', $filters['date_from']))
            ->when($filters['date_to'] !== '',    fn ($q) => $q->whereDate('created_at', '<=', $filters['date_to']))
            ->when($filters['amount_min'] !== '', fn ($q) => $q->where('amount', '>=', $filters['amount_min']))
            ->when($filters['amount_max'] !== '', fn ($q) => $q->where('amount', '<=', $filters['amount_max']))
            ->when($filters['owner_id'] !== '',   fn ($q) => $q->where('owner_id', $filters['owner_id']))
            ->when($filters['ref_table'] !== '',  fn ($q) => $q->where('ref_table', 'like', $filters['ref_table']))
            ->when($filters['ref_id'] !== '',     fn ($q) => $q->where('ref_id', $filters['ref_id']))
            ->orderByDesc('id');

        // Ambil hasil dulu untuk mengumpulkan owner_id per role
        $raw = $query->paginate(20);

        $ownersUserIds = $raw->getCollection()->where('owner_role', 'user')->pluck('owner_id')->unique()->values();
        $ownersTechIds = $raw->getCollection()->where('owner_role', 'technician')->pluck('owner_id')->unique()->values();

        $users = User::query()
            ->whereIn('id', $ownersUserIds)
            ->get(['id', 'name', 'email', 'phone', 'role'])
            ->keyBy('id');

        $techs = User::query()
            ->whereIn('id', $ownersTechIds)
            ->get(['id', 'name', 'email', 'phone', 'role'])
            ->keyBy('id');

        // Map hasil ke bentuk yang ramah TSX
        $balances = $raw->through(function (Balance $b) use ($users, $techs) {
            $owner = null;
            if ($b->owner_role === 'user') {
                $u = $users->get($b->owner_id);
                if ($u) {
                    $owner = [
                        'id'    => $u->id,
                        'role'  => 'user',
                        'name'  => $u->name,
                        'email' => $u->email,
                        'phone' => $u->phone,
                    ];
                }
            } elseif ($b->owner_role === 'technician') {
                $t = $techs->get($b->owner_id);
                if ($t) {
                    $owner = [
                        'id'    => $t->id,
                        'role'  => 'technician',
                        'name'  => $t->name,
                        'email' => $t->email,
                        'phone' => $t->phone,
                    ];
                }
            }

            return [
                'id'         => $b->id,
                'owner_role' => $b->owner_role,
                'owner_id'   => $b->owner_id,
                'amount'     => $b->amount,
                'currency'   => $b->currency,
                'type'       => $b->type,
                'ref_table'  => $b->ref_table,
                'ref_id'     => $b->ref_id,
                'note'       => $b->note,
                'created_at' => optional($b->created_at)->format('c'),
                'owner'      => $owner, // optional, bisa null
            ];
        });

        return Inertia::render('admin/balances/index', [
            'balances' => $balances,
            'filters'  => $filters,
        ]);
    }
}
