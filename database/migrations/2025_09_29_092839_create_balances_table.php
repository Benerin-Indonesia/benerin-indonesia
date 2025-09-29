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
        Schema::create('balances', function (Blueprint $table) {
            $table->id();

            // Pemilik saldo (user atau technician → tetap refer ke users.id)
            $table->string('owner_role', 20); // 'user' | 'technician'
            $table->foreignId('owner_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            // Nilai transaksi (bisa negatif)
            $table->decimal('amount', 12, 2);

            // Mata uang (default IDR)
            $table->string('currency', 10)->default('IDR');

            // Tipe entri ledger
            // 'hold' | 'payout' | 'adjustment' | 'refund_credit' | 'refund_reversal' | 'payment_debit'
            $table->string('type', 30);

            // Referensi ke entitas lain (opsional), misal payments / service_requests / payouts
            $table->string('ref_table')->nullable();
            $table->unsignedBigInteger('ref_id')->nullable();

            $table->string('note')->nullable();

            // Hanya created_at (ledger bersifat append-only)
            $table->timestamp('created_at')->useCurrent();

            // Indexes
            $table->index(['owner_role', 'owner_id']);
            $table->index('type');
            $table->index(['ref_table', 'ref_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('balances');
    }
};
