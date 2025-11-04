<?php

namespace App\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payout extends Model
{
    use HasFactory;

    protected $table = 'payouts';

    public const STATUS_PENDING  = 'pending';
    public const STATUS_PAID     = 'paid';
    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'technician_id',
        'amount',
        'status',
        'bank_name',
        'account_name',
        'account_number',
        'paid_at',
        'note',
        'transfer_receipt_path',
    ];

    protected $casts = [
        'amount'  => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    /* ========== Relations ========== */

    public function technician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'technician_id');
    }

    /* ========== Scopes ========== */

    public function scopeForTechnician($q, int $technicianId)
    {
        return $q->where('technician_id', $technicianId);
    }

    public function scopeStatus($q, string $status)
    {
        return $q->where('status', $status);
    }

    public function scopePending($q)
    {
        return $q->where('status', self::STATUS_PENDING);
    }

    public function scopePaid($q)
    {
        return $q->where('status', self::STATUS_PAID);
    }

    public function scopeRejected($q)
    {
        return $q->where('status', self::STATUS_REJECTED);
    }

    /* ========== Helpers (opsional) ========== */

    public function markPaid(?string $note = null): bool
    {
        $this->status  = self::STATUS_PAID;
        $this->paid_at = now();
        if ($note !== null) $this->note = $note;
        return $this->save();
    }

    public function markRejected(?string $note = null): bool
    {
        $this->status = self::STATUS_REJECTED;
        if ($note !== null) $this->note = $note;
        return $this->save();
    }

}
