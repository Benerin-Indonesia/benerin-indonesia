<?php

namespace App\Models;


use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RequestPhoto extends Model
{
    use HasFactory;

    protected $table = 'request_photos';

    public $timestamps = false;

    protected $fillable = [
        'service_request_id',
        'path',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function serviceRequest(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class);
    }
}
