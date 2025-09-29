<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Refund extends Model
{
    use HasFactory;

    protected $table = 'refunds';

    // Status constants
    public const STATUS_REQUESTED  = 'requested';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_REFUNDED   = 'refunded';
    public const STATUS_FAILED     = 'failed';

    protected $fillable = [
        'payment_id',
        'amount',
        'reason',
        'status',
        'provider_ref',
        'payload',
        'refunded_at',
    ];

    protected $casts = [
        'amount'      => 'decimal:2',
        'payload'     => 'array',
        'refunded_at' => 'datetime',
    ];

    /* ===== Relations ===== */

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    /* ===== Scopes bantu (opsional) ===== */

    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeForPayment($query, int $paymentId)
    {
        return $query->where('payment_id', $paymentId);
    }

    /* ===== Helpers ===== */

    public function isRefunded(): bool
    {
        return $this->status === self::STATUS_REFUNDED;
    }

    public function markProcessing(): void
    {
        $this->status = self::STATUS_PROCESSING;
        $this->save();
    }

    public function markRefunded(?string $providerRef = null, ?array $payload = null): void
    {
        $this->status       = self::STATUS_REFUNDED;
        $this->provider_ref = $providerRef;
        if ($payload !== null) $this->payload = $payload;
        $this->refunded_at  = now();
        $this->save();
    }

    public function markFailed(?string $reason = null): void
    {
        $this->status = self::STATUS_FAILED;
        if ($reason) $this->reason = $reason;
        $this->save();
    }
}
