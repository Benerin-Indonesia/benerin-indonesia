<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TechnicianService extends Model
{
    protected $guarded = [];

    public function technician()
    {
        return $this->belongsTo(User::class, 'technician_id');
    }

    public function serviceRequests()
    {
        return $this->hasMany(ServiceRequest::class, 'technician_id', 'technician_id')
            ->whereColumn('service_requests.category', 'technician_services.category');
    }
}
