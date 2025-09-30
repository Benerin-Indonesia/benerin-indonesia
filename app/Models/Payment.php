<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $table = 'payments';

    // Status constants
    public const STATUS_PENDING  = 'pending';
    public const STATUS_SETTLED  = 'settled';
    public const STATUS_FAILURE  = 'failure';
    public const STATUS_REFUNDED = 'refunded';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'service_request_id',
        'user_id',
        'technician_id',
        'amount',
        'status',
        'provider',
        'provider_ref',
        'snap_token',
        'snap_redirect_url',
        'paid_at',
        'refunded_at',
        'webhook_payload',
    ];

    protected $casts = [
        'amount'          => 'decimal:2',
        'paid_at'         => 'datetime',
        'refunded_at'     => 'datetime',
        'webhook_payload' => 'array',
    ];

    /* ===== Relations ===== */

    public function serviceRequest(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function technician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'technician_id');
    }

    /* ===== Scopes bantu (opsional) ===== */

    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeSettled($query)
    {
        return $query->where('status', self::STATUS_SETTLED);
    }

    public function scopeProviderRef($query, string $ref)
    {
        return $query->where('provider_ref', $ref);
    }

    public function scopeForRequest($query, int $requestId)
    {
        return $query->where('service_request_id', $requestId);
    }

    /* ===== Helpers ===== */

    public function isSettled(): bool
    {
        return $this->status === self::STATUS_SETTLED;
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }
}
