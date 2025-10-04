<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_requests', function (Blueprint $table) {
            $table->enum('status', [
                'menunggu',
                'diproses',
                'dijadwalkan',
                'selesai',
                'dibatalkan',
                'ditolak' // contoh status baru
            ])->default('menunggu')->change();
        });
    }

    public function down(): void
    {
        Schema::table('service_requests', function (Blueprint $table) {
            $table->string('status', 20);
        });
    }
};
