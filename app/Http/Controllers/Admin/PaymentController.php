<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $filters = [
            'q'             => $request->string('q')->toString(),
            'status'        => $request->string('status')->toString(),
            'provider'      => $request->string('provider')->toString(),
            'date_from'     => $request->string('date_from')->toString(),
            'date_to'       => $request->string('date_to')->toString(),
            'amount_min'    => $request->string('amount_min')->toString(),
            'amount_max'    => $request->string('amount_max')->toString(),
            'technician_id' => $request->string('technician_id')->toString(),
            'user_id'       => $request->string('user_id')->toString(),
            'request_id'    => $request->string('request_id')->toString(),
        ];

        $query = Payment::query()
            ->with([
                'user:id,name,email,phone',
                'technician:id,name,email,phone',
            ])
            ->when($filters['q'] !== '', function ($q) use ($filters) {
                $term = '%' . str_replace(' ', '%', $filters['q']) . '%';
                $idNum = ctype_digit($filters['q']) ? (int) $filters['q'] : null;

                $q->where(function ($w) use ($term, $idNum) {
                    if ($idNum !== null) {
                        $w->orWhere('id', $idNum)
                          ->orWhere('service_request_id', $idNum)
                          ->orWhere('user_id', $idNum)
                          ->orWhere('technician_id', $idNum);
                    }
                    $w->orWhere('provider_ref', 'like', $term)
                      ->orWhereHas('user', function ($wu) use ($term) {
                          $wu->where('name', 'like', $term)->orWhere('email', 'like', $term);
                      })
                      ->orWhereHas('technician', function ($wt) use ($term) {
                          $wt->where('name', 'like', $term)->orWhere('email', 'like', $term);
                      });
                });
            })
            ->when($filters['status'] !== '', fn ($q) => $q->where('status', $filters['status']))
            ->when($filters['provider'] !== '', fn ($q) => $q->where('provider', $filters['provider']))
            ->when($filters['date_from'] !== '', fn ($q) => $q->whereDate('created_at', '>=', $filters['date_from']))
            ->when($filters['date_to'] !== '', fn ($q) => $q->whereDate('created_at', '<=', $filters['date_to']))
            ->when($filters['amount_min'] !== '', fn ($q) => $q->where('amount', '>=', $filters['amount_min']))
            ->when($filters['amount_max'] !== '', fn ($q) => $q->where('amount', '<=', $filters['amount_max']))
            ->when($filters['technician_id'] !== '', fn ($q) => $q->where('technician_id', $filters['technician_id']))
            ->when($filters['user_id'] !== '', fn ($q) => $q->where('user_id', $filters['user_id']))
            ->when($filters['request_id'] !== '', fn ($q) => $q->where('service_request_id', $filters['request_id']))
            ->orderByDesc('id');

        $payments = $query->paginate(20)->through(function (Payment $p) {
            return [
                'id'                  => $p->id,
                'service_request_id'  => $p->service_request_id,
                'user_id'             => $p->user_id,
                'technician_id'       => $p->technician_id,
                'amount'              => $p->amount,
                'status'              => $p->status,
                'provider'            => $p->provider,
                'provider_ref'        => $p->provider_ref,
                'paid_at'             => optional($p->paid_at)->format('c'),
                'created_at'          => optional($p->created_at)->format('c'),
                'user' => $p->user ? [
                    'id'    => $p->user->id,
                    'name'  => $p->user->name,
                    'email' => $p->user->email,
                    'phone' => $p->user->phone,
                ] : null,
                'technician' => $p->technician ? [
                    'id'    => $p->technician->id,
                    'name'  => $p->technician->name,
                    'email' => $p->technician->email,
                    'phone' => $p->technician->phone,
                ] : null,
            ];
        });

        // Distinct providers untuk dropdown
        $providers = Payment::query()
            ->select('provider')
            ->distinct()
            ->orderBy('provider')
            ->pluck('provider')
            ->filter() // buang null/empty
            ->values();

        // Dropdown teknisi & user (ringan, limit)
        $technicians = User::query()->where('role', 'teknisi')->orderBy('name')->limit(200)->get(['id','name','email','phone']);
        $users       = User::query()->where('role', 'user')->orderBy('name')->limit(200)->get(['id','name','email','phone']);

        return Inertia::render('admin/payments/index', [
            'payments'    => $payments,
            'providers'   => $providers,
            'technicians' => $technicians,
            'users'       => $users,
            'filters'     => $filters,
        ]);
    }

    /**
     * GET /admin/payments/{id}
     * Kirim detail lengkap: payment (+user, teknisi),
     * ringkasan request, dan daftar refunds
     */
    public function show(int $id)
    {
        $p = Payment::query()
            ->with([
                'user:id,name,email,phone',
                'technician:id,name,email,phone',
            ])
            ->findOrFail($id);

        $payment = [
            'id'                 => $p->id,
            'service_request_id' => $p->service_request_id,
            'user_id'            => $p->user_id,
            'technician_id'      => $p->technician_id,
            'amount'             => $p->amount,
            'status'             => $p->status,
            'provider'           => $p->provider,
            'provider_ref'       => $p->provider_ref,
            'paid_at'            => optional($p->paid_at)->format('c'),
            'created_at'         => optional($p->created_at)->format('c'),
            'updated_at'         => optional($p->updated_at)->format('c'),
            'snap_token'         => $p->snap_token ?? null,
            'snap_redirect_url'  => $p->snap_redirect_url ?? null,
            // decode webhook_payload JSON (kalau kolomnya json/text)
            'webhook_payload'    => $this->decodeJson($p->webhook_payload),
            'user' => $p->user ? [
                'id'    => $p->user->id,
                'name'  => $p->user->name,
                'email' => $p->user->email,
                'phone' => $p->user->phone,
            ] : null,
            'technician' => $p->technician ? [
                'id'    => $p->technician->id,
                'name'  => $p->technician->name,
                'email' => $p->technician->email,
                'phone' => $p->technician->phone,
            ] : null,
        ];

        // Ringkasan service request
        $req = ServiceRequest::query()
            ->select(['id','category','status','accepted_price'])
            ->find($p->service_request_id);

        $requestLite = $req ? [
            'id'              => $req->id,
            'category'        => (string) $req->category,
            'status'          => (string) $req->status,
            'accepted_price'  => $req->accepted_price,
        ] : null;

        // Refunds yang terkait payment
        $refunds = DB::table('refunds')
            ->where('payment_id', $p->id)
            ->orderByDesc('id')
            ->get()
            ->map(function ($r) {
                return [
                    'id'           => (int) $r->id,
                    'amount'       => (string) $r->amount,
                    'status'       => (string) $r->status,
                    'reason'       => $r->reason,
                    'refunded_at'  => $r->refunded_at ? date('c', strtotime($r->refunded_at)) : null,
                    'provider_ref' => $r->provider_ref,
                ];
            })
            ->toArray();

        return Inertia::render('admin/payments/show', [
            'payment' => $payment,
            'request' => $requestLite,
            'refunds' => $refunds,
        ]);
    }

    /** Decode kolom JSON yang bisa berisi string/array/null */
    private function decodeJson($val): ?array
    {
        if (is_array($val)) return $val;
        if (is_string($val) && $val !== '') {
            try {
                /** @var array<string,mixed>|null */
                $decoded = json_decode($val, true, 512, JSON_THROW_ON_ERROR);
                return is_array($decoded) ? $decoded : null;
            } catch (\Throwable $e) {
                return null;
            }
        }
        return null;
    }
}
