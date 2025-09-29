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
        Schema::create('payouts', function (Blueprint $table) {
            $table->id();

            // Penerima payout (teknisi)
            $table->foreignId('technician_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            // Jumlah penarikan
            $table->decimal('amount', 12, 2);

            // Status: pending | paid | rejected
            $table->string('status', 20)->default('pending');

            // Snapshot data rekening saat ajukan payout
            $table->string('bank_name', 100);
            $table->string('account_name', 150);
            $table->string('account_number', 60);

            // Waktu dibayar (jika paid)
            $table->timestamp('paid_at')->nullable();

            $table->string('note', 255)->nullable();

            $table->timestamps();

            // Indexes
            $table->index('technician_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payouts');
    }
};
