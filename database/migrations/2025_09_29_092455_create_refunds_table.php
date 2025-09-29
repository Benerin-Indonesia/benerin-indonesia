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
        Schema::create('refunds', function (Blueprint $table) {
            $table->id();

            $table->foreignId('payment_id')
                ->constrained('payments')
                ->cascadeOnDelete();

            $table->decimal('amount', 12, 2);
            $table->string('reason')->nullable();

            // 'requested' | 'processing' | 'refunded' | 'failed'
            $table->string('status', 20)->default('requested');

            $table->string('provider_ref')->nullable();
            $table->json('payload')->nullable();

            $table->timestamp('refunded_at')->nullable();

            $table->timestamps();

            // Indexes
            $table->index('payment_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('refunds');
    }
};
