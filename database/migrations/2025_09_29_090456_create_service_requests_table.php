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
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();
            $table->foreignId('technician_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->string('category', 100);
            $table->text('description');
            $table->dateTime('scheduled_for')->nullable();
            $table->decimal('accepted_price', 12, 2)->nullable();
            $table->string('status', 20);
            $table->timestamps();
            $table->index('user_id');
            $table->index('technician_id');
            $table->index('status');
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
