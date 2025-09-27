<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('service_requests', function (Blueprint $table) {
            $table->id();

            // foreign keys
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('technician_id')
                ->nullable()
                ->constrained('users') // rujuk ke tabel users
                ->cascadeOnDelete();

            // data utama
            $table->string('title');
            $table->string('category'); // berupa slug
            $table->text('description');
            $table->dateTime('scheduled_for')->nullable();
            $table->decimal('accepted_price', 12, 2)->nullable();

            // status enum
            $table->enum('status', [
                'menunggu',
                'diproses',
                'dijadwalkan',
                'selesai',
                'dibatalkan',
            ])->default('menunggu');

            $table->timestamps();

            // index tambahan
            $table->index(['user_id', 'technician_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_requests');
    }
};
