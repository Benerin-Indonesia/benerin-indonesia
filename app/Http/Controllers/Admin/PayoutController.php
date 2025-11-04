<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payout;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class PayoutController extends Controller
{
    /**
     * GET /admin/payouts
     * Filters:
     *  - q: cari di id, nama/email teknisi, bank_name/account_name/account_number
     *  - status: pending|paid|rejected
     *  - date_from/date_to: filter created_at (YYYY-MM-DD)
     *  - amount_min/amount_max
     *  - technician_id
     */
    public function index(Request $request)
    {
        $filters = [
            'q'             => $request->string('q')->toString(),
            'status'        => $request->string('status')->toString(),
            'date_from'     => $request->string('date_from')->toString(),
            'date_to'       => $request->string('date_to')->toString(),
            'amount_min'    => $request->string('amount_min')->toString(),
            'amount_max'    => $request->string('amount_max')->toString(),
            'technician_id' => $request->string('technician_id')->toString(),
        ];

        $query = Payout::query()
            ->with([
                'technician:id,name,email,phone',
            ])
            ->when($filters['q'] !== '', function ($q) use ($filters) {
                $term = '%' . str_replace(' ', '%', $filters['q']) . '%';
                $idNum = ctype_digit($filters['q']) ? (int) $filters['q'] : null;

                $q->where(function ($w) use ($term, $idNum) {
                    if ($idNum !== null) {
                        $w->orWhere('id', $idNum)
                            ->orWhere('technician_id', $idNum);
                    }
                    $w->orWhere('bank_name', 'like', $term)
                        ->orWhere('account_name', 'like', $term)
                        ->orWhere('account_number', 'like', $term)
                        ->orWhereHas('technician', function ($wt) use ($term) {
                            $wt->where('name', 'like', $term)->orWhere('email', 'like', $term);
                        });
                });
            })
            ->when($filters['status'] !== '', fn($q) => $q->where('status', $filters['status']))
            ->when($filters['date_from'] !== '', fn($q) => $q->whereDate('created_at', '>=', $filters['date_from']))
            ->when($filters['date_to'] !== '',   fn($q) => $q->whereDate('created_at', '<=', $filters['date_to']))
            ->when($filters['amount_min'] !== '', fn($q) => $q->where('amount', '>=', $filters['amount_min']))
            ->when($filters['amount_max'] !== '', fn($q) => $q->where('amount', '<=', $filters['amount_max']))
            ->when($filters['technician_id'] !== '', fn($q) => $q->where('technician_id', $filters['technician_id']))
            ->orderByDesc('id');

        $payouts = $query->paginate(20)->through(function (Payout $p) {
            return [
                'id'                      => $p->id,
                'technician_id'           => $p->technician_id,
                'amount'                  => $p->amount,
                'status'                  => $p->status,
                'bank_name'               => $p->bank_name,
                'account_name'            => $p->account_name,
                'account_number'          => $p->account_number,
                'paid_at'                 => optional($p->paid_at)->format('c'),
                'note'                    => $p->note,
                'created_at'              => optional($p->created_at)->format('c'),
                // ✅ tambahkan ini untuk informasi bukti pada list (opsional ditampilkan di tabel)
                'transfer_receipt_path'   => $p->transfer_receipt_path,
                'technician' => $p->technician ? [
                    'id'    => $p->technician->id,
                    'name'  => $p->technician->name,
                    'email' => $p->technician->email,
                    'phone' => $p->technician->phone,
                ] : null,
            ];
        });

        // Dropdown teknisi (ringan)
        $technicians = User::query()
            ->where('role', 'teknisi')
            ->orderBy('name')
            ->limit(200)
            ->get(['id', 'name', 'email', 'phone']);

        return Inertia::render('admin/payouts/index', [
            'payouts'     => $payouts,
            'technicians' => $technicians,
            'filters'     => $filters,
        ]);
    }

    /**
     * GET /admin/payouts/{id}
     * Kirim detail payout + entri ledger terkait (opsional)
     */
    public function show(int $id)
    {
        $p = Payout::query()
            ->with(['technician:id,name,email,phone'])
            ->findOrFail($id);

        $payout = [
            'id'                      => $p->id,
            'technician_id'           => $p->technician_id,
            'amount'                  => $p->amount,
            'status'                  => $p->status,
            'bank_name'               => $p->bank_name,
            'account_name'            => $p->account_name,
            'account_number'          => $p->account_number,
            'paid_at'                 => optional($p->paid_at)->format('c'),
            'note'                    => $p->note,
            'created_at'              => optional($p->created_at)->format('c'),
            'updated_at'              => optional($p->updated_at)->format('c'),
            // ✅ tambahan: supaya frontend bisa render link/preview bukti
            'transfer_receipt_path'   => $p->transfer_receipt_path,
            'technician' => $p->technician ? [
                'id'    => $p->technician->id,
                'name'  => $p->technician->name,
                'email' => $p->technician->email,
                'phone' => $p->technician->phone,
            ] : null,
        ];

        // Ledger entri terkait payout ini (opsional, untuk panel kanan)
        $ledger = DB::table('balances')
            ->where('owner_role', 'technician')
            ->where('owner_id', $p->technician_id)
            ->where('type', 'payout')
            ->where('ref_table', 'payouts')
            ->where('ref_id', $p->id)
            ->orderBy('id')
            ->get([
                'id',
                'owner_role',
                'owner_id',
                'amount',
                'currency',
                'type',
                'ref_table',
                'ref_id',
                'note',
                'created_at',
            ])
            ->map(function ($r) {
                return [
                    'id'         => (int) $r->id,
                    'owner_role' => (string) $r->owner_role,
                    'owner_id'   => (int) $r->owner_id,
                    'amount'     => (string) $r->amount,
                    'currency'   => (string) $r->currency,
                    'type'       => (string) $r->type,
                    'ref_table'  => $r->ref_table,
                    'ref_id'     => $r->ref_id ? (int) $r->ref_id : null,
                    'note'       => $r->note,
                    'created_at' => $r->created_at ? date('c', strtotime($r->created_at)) : null,
                ];
            })
            ->toArray();

        return Inertia::render('admin/payouts/show', [
            'payout' => $payout,
            'ledger' => $ledger,
        ]);
    }

    /**
     * POST /admin/payouts/{id}/approve
     * Wajib upload bukti (screenshot / pdf). Set status=paid, paid_at=now().
     */
    public function approve(Request $request, int $id)
    {
        $payout = Payout::findOrFail($id);

        if ($payout->status !== Payout::STATUS_PENDING) {
            return back()->withErrors(['status' => 'Payout tidak dalam status pending.'])
                ->setStatusCode(Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $validated = $request->validate([
            'receipt' => ['required', 'file', 'max:4096', 'mimes:jpg,jpeg,png,webp,pdf'], // 4MB
            'note'    => ['nullable', 'string', 'max:500'],
        ]);

        $path = $request->file('receipt')->store('payouts', 'public');

        // Update payout
        $payout->transfer_receipt_path = $path;
        $payout->status  = Payout::STATUS_PAID;
        $payout->paid_at = now();
        if (!empty($validated['note'])) {
            $payout->note = $validated['note'];
        }
        $payout->save();

        return redirect()
            ->route('admin.payouts.show', ['id' => $payout->id])
            ->with('success', 'Payout disetujui dan bukti transfer telah diunggah.');
    }

    /**
     * POST /admin/payouts/{id}/reject
     * Wajib alasan penolakan (min 5 karakter). Set status=rejected, paid_at=NULL.
     */
    public function reject(Request $request, int $id)
    {
        $payout = Payout::findOrFail($id);

        if ($payout->status !== Payout::STATUS_PENDING) {
            return back()->withErrors(['status' => 'Payout tidak dalam status pending.'])->setStatusCode(Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $validated = $request->validate([
            'note' => ['required', 'string', 'min:5', 'max:500'],
        ]);

        $payout->status  = Payout::STATUS_REJECTED;
        $payout->paid_at = null;
        $payout->note    = $validated['note'];
        $payout->save();

        return redirect()
            ->route('admin.payouts.show', ['id' => $payout->id])
            ->with('success', 'Payout telah ditolak.');
    }
}
