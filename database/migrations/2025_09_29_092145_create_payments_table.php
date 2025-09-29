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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            // Relasi
            $table->foreignId('service_request_id')
                  ->constrained('service_requests')
                  ->cascadeOnDelete();

            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->foreignId('technician_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            // Nilai & status
            $table->decimal('amount', 12, 2);

            // 'pending' | 'settled' | 'failure' | 'refunded' | 'cancelled'
            $table->string('status', 20)->default('pending');

            // Provider & referensi eksternal (Midtrans)
            $table->string('provider', 50)->default('midtrans');
            $table->string('provider_ref')->nullable();

            // Snap (opsional)
            $table->string('snap_token')->nullable();
            $table->string('snap_redirect_url')->nullable();

            // Waktu pembayaran & refund
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('refunded_at')->nullable();

            // Payload webhook
            $table->json('webhook_payload')->nullable();

            $table->timestamps();

            // Indexes
            $table->index('service_request_id');
            $table->index('status');
            $table->index('provider_ref');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
