<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('technician_services', function (Blueprint $table) {
            $table->id();

            // foreign key ke users (technician)
            $table->foreignId('technician_id')
                ->nullable()
                ->constrained('users') // arahkan ke tabel users
                ->cascadeOnDelete();

            $table->string('category'); // slug kategori
            $table->boolean('active')->default(true);

            $table->timestamps();

            // kombinasi unik: 1 teknisi hanya bisa punya 1 kategori tertentu
            $table->unique(['technician_id', 'category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('technician_services');
    }
};
