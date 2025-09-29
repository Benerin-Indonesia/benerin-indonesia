<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Casts\Attribute;

class User extends Authenticatable
{
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /** Role constants (DB memakai 'teknisi') */
    public const ROLE_USER    = 'user';
    public const ROLE_TEKNISI = 'teknisi';
    public const ROLE_ADMIN   = 'admin';

    /** @var list<string> */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',          // 'user' | 'teknisi' | 'admin'
        'phone',
        'photo',
        'bank_name',
        'account_name',
        'account_number',
    ];

    /** @var list<string> */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    /**
     * Normalisasi role:
     * - Jika ada input 'technician' dari FE, simpan sebagai 'teknisi' agar konsisten dgn enum DB.
     */
    protected function role(): Attribute
    {
        return Attribute::make(
            set: function ($value) {
                if ($value === 'technician') return self::ROLE_TEKNISI;
                return $value;
            }
        );
    }

    /* ===========================
     * Helpers (cek peran)
     * =========================== */
    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isTeknisi(): bool
    {
        return $this->role === self::ROLE_TEKNISI;
    }

    public function isUser(): bool
    {
        return $this->role === self::ROLE_USER;
    }

    /* ===========================
     * Scopes
     * =========================== */
    public function scopeAdmins($q)
    {
        return $q->where('role', self::ROLE_ADMIN);
    }

    public function scopeTeknisi($q)
    {
        return $q->where('role', self::ROLE_TEKNISI);
    }

    public function scopeUsers($q)
    {
        return $q->where('role', self::ROLE_USER);
    }

    /* ===========================
     * Relations
     * =========================== */

    /** Permintaan yang dibuat user (kolom user_id) */
    public function serviceRequests(): HasMany
    {
        return $this->hasMany(ServiceRequest::class, 'user_id');
    }

    /** Permintaan yang di-assign ke teknisi ini (kolom technician_id) */
    public function assignedRequests(): HasMany
    {
        return $this->hasMany(ServiceRequest::class, 'technician_id');
    }

    /** Matrix layanan (kategori) yang diambil teknisi */
    public function technicianServices(): HasMany
    {
        return $this->hasMany(TechnicianService::class, 'technician_id');
    }

    /** Pesan yang dikirim user ini (chat) */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    /** Pembayaran yang dibuat oleh user ini (sebagai payer) */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'user_id');
    }

    /** Pembayaran yang terkait teknisi ini (sebagai payee) */
    public function technicianPayments(): HasMany
    {
        return $this->hasMany(Payment::class, 'technician_id');
    }

    /** Payout milik teknisi ini */
    public function payouts(): HasMany
    {
        return $this->hasMany(Payout::class, 'technician_id');
    }

    /** Ledger saldo saat user menjadi pemilik saldo role=user */
    public function balancesAsUser(): HasMany
    {
        return $this->hasMany(Balance::class, 'owner_id')
            ->where('owner_role', 'user');
    }

    /** Ledger saldo saat user menjadi pemilik saldo role=technician */
    public function balancesAsTechnician(): HasMany
    {
        return $this->hasMany(Balance::class, 'owner_id')
            ->where('owner_role', 'technician');
    }
}
