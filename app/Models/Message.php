<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    use HasFactory;

    protected $table = 'messages';

    /** Tipe yang didukung */
    public const TYPE_TEXT   = 'text';
    public const TYPE_OFFER  = 'offer';
    public const TYPE_SYSTEM = 'system';

    protected $fillable = [
        'service_request_id',
        'sender_id',
        'type',
        'body',
        'payload',
        'is_read',
    ];

    protected $casts = [
        'payload' => 'array',
        'is_read' => 'boolean',
    ];

    /** Relasi: pesan milik satu service request */
    public function serviceRequest(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class);
    }

    /** Relasi: pengirim pesan adalah user */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /* ==== Scopes bantu (opsional) ==== */

    /** Hanya pesan unread */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /** Filter berdasarkan tipe */
    public function scopeType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /** Filter berdasarkan request */
    public function scopeForRequest($query, int $requestId)
    {
        return $query->where('service_request_id', $requestId);
    }
}
