<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TechnicianService extends Model
{
    use HasFactory;

    protected $table = 'technician_services';

    protected $fillable = ['technician_id', 'category', 'active'];
    protected $casts = ['active' => 'boolean'];

    public function technician()
    {
        return $this->belongsTo(User::class, 'technician_id');
    }
}
