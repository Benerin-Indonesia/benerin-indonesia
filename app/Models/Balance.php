<?php

namespace App\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Balance extends Model
{
    use HasFactory;

    protected $table = 'balances';

    // Ledger pakai created_at saja (append-only)
    public $timestamps = false;

    // Owner roles
    public const ROLE_USER       = 'user';
    public const ROLE_TECHNICIAN = 'teknisi';

    // Types
    public const TYPE_HOLD            = 'hold';
    public const TYPE_PAYOUT          = 'payout';
    public const TYPE_ADJUSTMENT      = 'adjustment';
    public const TYPE_REFUND_CREDIT   = 'refund_credit';
    public const TYPE_REFUND_REVERSAL = 'refund_reversal';
    public const TYPE_PAYMENT_DEBIT   = 'payment_debit';

    protected $fillable = [
        'owner_role',
        'owner_id',
        'amount',
        'currency',
        'type',
        'ref_table',
        'ref_id',
        'note',
        'created_at',
    ];

    protected $casts = [
        'amount'     => 'decimal:2',
        'created_at' => 'datetime',
    ];

    /* ===== Relations ===== */

    public function owner(): BelongsTo
    {
        // owner_role: 'user' | 'teknisi' → sama-sama ke users
        return $this->belongsTo(User::class, 'owner_id');
    }

    /* ===== Scopes bantu ===== */

    public function scopeOwner($query, string $role, int $ownerId)
    {
        return $query->where('owner_role', $role)->where('owner_id', $ownerId);
    }

    public function scopeType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeRef($query, ?string $table, ?int $id)
    {
        if ($table === null || $id === null) return $query;
        return $query->where('ref_table', $table)->where('ref_id', $id);
    }

    /* ===== Helpers ===== */

    /** Hitung saldo terkini untuk owner */
    public static function currentBalance(string $role, int $ownerId): string
    {
        return (string) static::owner($role, $ownerId)->sum('amount');
    }

    /** Catat entri ledger singkat */
    public static function post(array $attrs): self
    {
        // isi default
        $attrs['currency']  = $attrs['currency']  ?? 'IDR';
        $attrs['created_at'] = $attrs['created_at'] ?? now();

        return static::create($attrs);
    }
}
