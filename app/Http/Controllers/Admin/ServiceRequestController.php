<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ServiceRequestController extends Controller
{
    public function index(Request $request)
    {
        $filters = [
            'q'            => $request->string('q')->toString(),
            'status'       => $request->string('status')->toString(),
            'category'     => $request->string('category')->toString(),
            'pay'          => $request->string('pay')->toString(),
            'date_from'    => $request->string('date_from')->toString(),
            'date_to'      => $request->string('date_to')->toString(),
            'technician_id'=> $request->string('technician_id')->toString(),
            'user_id'      => $request->string('user_id')->toString(),
        ];

        $query = ServiceRequest::query()
            ->with([
                'user:id,name,email,phone',
                'technician:id,name,email,phone',
                // Ambil payment terbaru secara ringan; controller tidak bergantung relasi latestOfMany
                'payments' => function ($q) {
                    $q->latest('id')->limit(1);
                },
            ])
            ->when($filters['q'] !== '', function ($q) use ($filters) {
                $term = '%' . str_replace(' ', '%', $filters['q']) . '%';
                // Jika q numerik, izinkan cari by id juga
                $idNum = ctype_digit($filters['q']) ? (int) $filters['q'] : null;

                $q->where(function ($w) use ($term, $idNum) {
                    if ($idNum !== null) {
                        $w->orWhere('id', $idNum);
                    }
                    $w->orWhere('description', 'like', $term)
                      ->orWhereHas('user', function ($wu) use ($term) {
                          $wu->where('name', 'like', $term)->orWhere('email', 'like', $term);
                      })
                      ->orWhereHas('technician', function ($wt) use ($term) {
                          $wt->where('name', 'like', $term)->orWhere('email', 'like', $term);
                      });
                });
            })
            ->when($filters['status'] !== '', fn ($q) => $q->where('status', $filters['status']))
            ->when($filters['category'] !== '', fn ($q) => $q->where('category', $filters['category']))
            ->when($filters['technician_id'] !== '', fn ($q) => $q->where('technician_id', $filters['technician_id']))
            ->when($filters['user_id'] !== '', fn ($q) => $q->where('user_id', $filters['user_id']))
            ->when($filters['date_from'] !== '', fn ($q) => $q->whereDate('created_at', '>=', $filters['date_from']))
            ->when($filters['date_to'] !== '',   fn ($q) => $q->whereDate('created_at', '<=', $filters['date_to']))
            // Filter status pembayaran (cocokkan jika ADA payment dengan status tsb).
            ->when($filters['pay'] !== '', function ($q) use ($filters) {
                $q->whereHas('payments', function ($qp) use ($filters) {
                    $qp->where('status', $filters['pay']);
                });
            })
            ->orderByDesc('id');

        $requests = $query->paginate(20)->through(function (ServiceRequest $r) {
            $payment = optional($r->payments->first());
            return [
                'id'              => $r->id,
                'user_id'         => $r->user_id,
                'technician_id'   => $r->technician_id,
                'category'        => $r->category,
                'description'     => $r->description,
                'scheduled_for'   => optional($r->scheduled_for)->format('c'),
                'accepted_price'  => $r->accepted_price,
                'status'          => $r->status,
                'created_at'      => optional($r->created_at)->format('c'),
                'updated_at'      => optional($r->updated_at)->format('c'),
                'user' => $r->user ? [
                    'id'    => $r->user->id,
                    'name'  => $r->user->name,
                    'email' => $r->user->email,
                    'phone' => $r->user->phone,
                ] : null,
                'technician' => $r->technician ? [
                    'id'    => $r->technician->id,
                    'name'  => $r->technician->name,
                    'email' => $r->technician->email,
                    'phone' => $r->technician->phone,
                ] : null,
                'payment' => $payment ? [
                    'id'       => $payment->id,
                    'amount'   => $payment->amount,
                    'status'   => $payment->status,
                    'paid_at'  => optional($payment->paid_at)->format('c'),
                ] : null,
            ];
        });

        // Dropdown kategori (opsional dari DB; fallback jika tidak ada tabel)
        $categories = $this->loadCategories();

        // Dropdown teknisi & user untuk filter (limit agar ringan)
        $technicians = User::query()
            ->where('role', 'teknisi')
            ->orderBy('name')
            ->limit(200)
            ->get(['id', 'name', 'email', 'phone']);

        $users = User::query()
            ->where('role', 'user')
            ->orderBy('name')
            ->limit(200)
            ->get(['id', 'name', 'email', 'phone']);

        return Inertia::render('admin/requests/index', [
            'requests'    => $requests,
            'categories'  => $categories,
            'technicians' => $technicians,
            'users'       => $users,
            'filters'     => $filters,
        ]);
    }

    /**
     * GET /admin/requests/{id}
     * Kirim detail lengkap sesuai kebutuhan halaman show.tsx
     */
    public function show(int $id)
    {
        $req = ServiceRequest::query()
            ->with([
                'user:id,name,email,phone',
                'technician:id,name,email,phone',
            ])
            ->findOrFail($id);

        // Ambil payment terbaru (via DB agar tidak tergantung relasi khusus)
        $payment = DB::table('payments')
            ->where('service_request_id', $req->id)
            ->orderByDesc('id')
            ->first();

        $paymentArr = $payment ? [
            'id'                => (int) $payment->id,
            'amount'            => (string) $payment->amount,
            'status'            => (string) $payment->status,
            'provider'          => (string) $payment->provider,
            'provider_ref'      => $payment->provider_ref,
            'paid_at'           => $payment->paid_at ? date('c', strtotime($payment->paid_at)) : null,
            'snap_redirect_url' => $payment->snap_redirect_url,
        ] : null;

        // Refunds berdasarkan payment
        $refunds = [];
        if ($payment) {
            $refunds = DB::table('refunds')
                ->where('payment_id', $payment->id)
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
        }

        // Foto permintaan
        $photos = DB::table('request_photos')
            ->where('service_request_id', $req->id)
            ->orderBy('id')
            ->get(['id', 'path', 'created_at'])
            ->map(function ($p) {
                return [
                    'id'         => (int) $p->id,
                    'path'       => (string) $p->path,
                    'created_at' => $p->created_at ? date('c', strtotime($p->created_at)) : null,
                ];
            })
            ->toArray();

        // Pesan/chat + sender
        $messages = DB::table('messages as m')
            ->leftJoin('users as u', 'u.id', '=', 'm.sender_id')
            ->where('m.service_request_id', $req->id)
            ->orderBy('m.id')
            ->get([
                'm.id',
                'm.service_request_id',
                'm.sender_id',
                'm.type',
                'm.body',
                'm.payload',
                'm.is_read',
                'm.created_at',
                'u.id as u_id',
                'u.name as u_name',
                'u.email as u_email',
                'u.phone as u_phone',
            ])
            ->map(function ($m) {
                // payload JSON -> array
                $payload = null;
                if (!empty($m->payload)) {
                    try {
                        $payload = is_array($m->payload) ? $m->payload : json_decode($m->payload, true, 512, JSON_THROW_ON_ERROR);
                    } catch (\Throwable $e) {
                        $payload = null;
                    }
                }
                return [
                    'id'                 => (int) $m->id,
                    'service_request_id' => (int) $m->service_request_id,
                    'sender_id'          => $m->sender_id ? (int) $m->sender_id : 0,
                    'type'               => (string) $m->type,
                    'body'               => $m->body,
                    'payload'            => $payload,
                    'is_read'            => (bool) $m->is_read,
                    'created_at'         => $m->created_at ? date('c', strtotime($m->created_at)) : null,
                    'sender'             => $m->u_id ? [
                        'id'    => (int) $m->u_id,
                        'name'  => (string) $m->u_name,
                        'email' => (string) $m->u_email,
                        'phone' => $m->u_phone,
                    ] : null,
                ];
            })
            ->toArray();

        // Kategori untuk label (opsional; ada fallback)
        $categories = $this->loadCategories();

        // Bentuk payload request sesuai shape FE
        $requestArr = [
            'id'             => $req->id,
            'user_id'        => $req->user_id,
            'technician_id'  => $req->technician_id,
            'category'       => $req->category,
            'description'    => $req->description,
            'scheduled_for'  => optional($req->scheduled_for)->format('c'),
            'accepted_price' => $req->accepted_price,
            'status'         => $req->status,
            'created_at'     => optional($req->created_at)->format('c'),
            'updated_at'     => optional($req->updated_at)->format('c'),
            'user' => $req->user ? [
                'id'    => $req->user->id,
                'name'  => $req->user->name,
                'email' => $req->user->email,
                'phone' => $req->user->phone,
            ] : null,
            'technician' => $req->technician ? [
                'id'    => $req->technician->id,
                'name'  => $req->technician->name,
                'email' => $req->technician->email,
                'phone' => $req->technician->phone,
            ] : null,
            'payment' => $paymentArr, // juga disertakan di root props sebagai convenience
        ];

        return Inertia::render('admin/requests/show', [
            'request'    => $requestArr,
            'categories' => $categories,
            'photos'     => $photos,
            'messages'   => $messages,
            'payment'    => $paymentArr,
            'refunds'    => $refunds,
        ]);
    }

    /* ============================
       Helpers
    ============================ */

    /**
     * Muat daftar kategori (slug, name) dari tabel categories jika ada.
     * Jika tidak ada tabelnya, fallback ke daftar default.
     */
    private function loadCategories(): array
    {
        if (Schema::hasTable('categories')) {
            return DB::table('categories')
                ->orderBy('name')
                ->get(['slug', 'name'])
                ->map(fn ($r) => ['slug' => (string) $r->slug, 'name' => (string) $r->name])
                ->toArray();
        }

        // Fallback agar FE tetap punya label manusiawi
        return [
            ['slug' => 'ac',         'name' => 'AC'],
            ['slug' => 'tv',         'name' => 'TV'],
            ['slug' => 'kulkas',     'name' => 'Kulkas'],
            ['slug' => 'mesin-cuci', 'name' => 'Mesin Cuci'],
        ];
    }
}
