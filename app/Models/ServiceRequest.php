<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceRequest extends Model
{
    protected $guarded = [];

    public function technician()
    {
        return $this->belongsTo(User::class, 'technician_id');
    }

    public function technicianService()
    {
        return $this->hasOne(TechnicianService::class, 'technician_id', 'technician_id')
            ->whereColumn('technician_services.category', 'service_requests.category');
    }
}
