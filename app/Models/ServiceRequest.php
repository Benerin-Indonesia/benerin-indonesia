<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $user_id
 * @property int|null $technician_id
 * @property string $category   // slug kategori (mis. "ac", "tv")
 * @property string $description
 * @property \Illuminate\Support\Carbon|null $scheduled_for
 * @property string|null $accepted_price
 * @property string $status     // menunggu|diproses|dijadwalkan|selesai|dibatalkan
 */
class ServiceRequest extends Model
{
    use HasFactory;

    protected $table = 'service_requests';

    protected $fillable = [
        'user_id',
        'technician_id',
        'category',
        'description',
        'scheduled_for',
        'accepted_price',
        'status',
    ];

    protected $casts = [
        'scheduled_for' => 'datetime',
        'accepted_price' => 'decimal:2',
        'created_at'     => 'datetime',
        'updated_at'     => 'datetime',
    ];

    /** Status constants */
    public const STATUS_WAITING    = 'menunggu';
    public const STATUS_PROCESS    = 'diproses';
    public const STATUS_SCHEDULED  = 'dijadwalkan';
    public const STATUS_DONE       = 'selesai';
    public const STATUS_CANCELLED  = 'dibatalkan';

    public const STATUSES = [
        self::STATUS_WAITING,
        self::STATUS_PROCESS,
        self::STATUS_SCHEDULED,
        self::STATUS_DONE,
        self::STATUS_CANCELLED,
    ];

    /** Default-kan status ke 'menunggu' saat create */
    protected static function booted(): void
    {
        static::creating(function (self $model) {
            if (empty($model->status)) {
                $model->status = self::STATUS_WAITING;
            }
        });
    }

    /* =========================
     *        RELATIONS
     * ========================= */

    /** Pemilik request (user/pelanggan) */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Teknisi yang ditugaskan (optional) */
    public function technician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'technician_id');
    }

    /** Referensi kategori via slug (opsional; butuh Model Category) */
    public function categoryRef(): BelongsTo
    {
        // relasi by slug → pastikan Model Category ada
        return $this->belongsTo(Category::class, 'category', 'slug');
    }

    /** Foto-foto keluhan (butuh Model RequestPhoto) */
    public function photos(): HasMany
    {
        return $this->hasMany(RequestPhoto::class);
    }

    /** Chat/message terkait (butuh Model Message) */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /** Pembayaran terkait (butuh Model Payment) */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /* =========================
     *         SCOPES
     * ========================= */

    /** Scope: filter status tertentu */
    public function scopeStatus(Builder $q, string $status): Builder
    {
        return $q->where('status', $status);
    }

    /** Scope: yang masih terbuka (belum selesai/batal) */
    public function scopeOpen(Builder $q): Builder
    {
        return $q->whereIn('status', [
            self::STATUS_WAITING,
            self::STATUS_PROCESS,
            self::STATUS_SCHEDULED,
        ]);
    }

    /** Scope: milik user tertentu */
    public function scopeForUser(Builder $q, int $userId): Builder
    {
        return $q->where('user_id', $userId);
    }

    /** Scope: milik teknisi tertentu */
    public function scopeForTechnician(Builder $q, int $technicianId): Builder
    {
        return $q->where('technician_id', $technicianId);
    }

    /** Scope: pencarian sederhana (deskripsi/kategori/nama user) */
    public function scopeSearch(Builder $q, ?string $term): Builder
    {
        if (!$term) return $q;

        return $q->where(function (Builder $sub) use ($term) {
            $sub->where('description', 'like', "%{$term}%")
                ->orWhere('category', 'like', "%{$term}%")
                ->orWhereHas(
                    'user',
                    fn(Builder $uq) =>
                    $uq->where('name', 'like', "%{$term}%")
                );
        });
    }

    /* =========================
     *       ACCESSORS
     * ========================= */

    /** Apakah request masih “open” */
    public function getIsOpenAttribute(): bool
    {
        return in_array($this->status, [
            self::STATUS_WAITING,
            self::STATUS_PROCESS,
            self::STATUS_SCHEDULED,
        ], true);
    }

    protected $appends = ['is_open'];
}
